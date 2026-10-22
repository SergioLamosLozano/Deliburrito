import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'deliburrito_table_session';

/**
 * Hook para gestionar la sesión de mesa colaborativa (Multijugador) al escanear QR.
 * Lee el parámetro ?mesa=HASH_DEL_QR de la URL, valida contra localStorage,
 * inspecciona el estado de la mesa (/api/tables/join), previene entrar como invitado
 * fantasma en mesas abandonadas mediante /api/tables/override, y mantiene la sesión viva
 * con Heartbeat cada 30 segundos (/api/tables/ping).
 */
export function useTableSession(showToast, onClearCart) {
  const [tableSession, setTableSession] = useState(null);
  const [qrHash, setQrHash] = useState(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [currentHostName, setCurrentHostName] = useState(null);

  // 1. Verificar parámetro 'mesa' al montar y consultar estado inicial
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const mesaParam = searchParams.get('mesa');

      if (!mesaParam) {
        // No hay parámetro de mesa en la URL: verificar si hay sesión previa válida
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.session_id) {
              setTableSession(parsed);
            }
          } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        return;
      }

      const cleanHash = mesaParam.trim();
      setQrHash(cleanHash);

      // 2. Verificar si ya existe una sesión activa para este mismo QR
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.qr_hash === cleanHash && parsed.session_id) {
            setTableSession(parsed);
            setIsTableModalOpen(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // Si existe ?mesa y no hay sesión activa coincidente, abrir modal
      setIsTableModalOpen(true);

      // Chequeo previo al servidor para detectar si la mesa está libre u ocupada por un anfitrión
      fetch('/api/tables/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ qr_hash: cleanHash }),
      })
        .then((res) => res.json().catch(() => null))
        .then((data) => {
          if (data?.status === 'occupied' && data?.host_name) {
            setCurrentHostName(data.host_name);
          } else if (data?.status === 'free') {
            setCurrentHostName(null);
          }
        })
        .catch((err) => {
          console.warn('Chequeo previo de estado de mesa:', err);
        });
    } catch (err) {
      console.error('Error al inicializar sesión de mesa:', err);
    }
  }, []);

  // 2. Salir de la mesa o reiniciar sesión cuando expira
  const leaveTable = useCallback((isExpired = false) => {
    localStorage.removeItem(STORAGE_KEY);
    setTableSession(null);
    setQrHash(null);
    setCurrentHostName(null);
    setIsTableModalOpen(false);
    setJoinError(null);

    // Limpiar query param de la URL sin recargar la página
    if (window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('mesa');
      window.history.replaceState({}, '', url.pathname + url.search);
    }

    if (isExpired) {
      if (typeof onClearCart === 'function') {
        try {
          onClearCart();
        } catch (e) {
          console.warn('Error al vaciar carrito tras expiración:', e);
        }
      }
      if (showToast) {
        showToast('Tu sesión de mesa ha expirado por inactividad.', 'warning');
      }
    }
  }, [showToast, onClearCart]);

  // 3. Heartbeat (Latido) de mesa: ping cada 30 segundos si hay sesión activa
  useEffect(() => {
    if (!tableSession?.session_id) {
      return;
    }

    const sessionId = tableSession.session_id;
    const hostDeviceId = tableSession.role === 'host' ? tableSession.host_device_id : null;

    let isSubscribed = true;

    const sendPing = async () => {
      try {
        const payload = {
          session_id: sessionId,
        };
        if (hostDeviceId) {
          payload.host_device_id = hostDeviceId;
        }

        const response = await fetch('/api/tables/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!isSubscribed) return;

        // Si la sesión fue eliminada (404) o la mesa fue liberada
        if (response.status === 404) {
          console.warn('La sesión de mesa expiró en el servidor o fue liberada.');
          leaveTable(true);
        }
      } catch (err) {
        console.warn('Error al enviar latido (Heartbeat) de mesa:', err);
      }
    };

    const intervalId = setInterval(sendPing, 30000);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [tableSession?.session_id, tableSession?.role, tableSession?.host_device_id, leaveTable]);

  // 4. Función para enviar el formulario y unirse a la mesa
  const joinTable = useCallback(async (guestName, confirmAsGuest = false) => {
    if (!qrHash) {
      setJoinError('No se encontró el código QR de la mesa en la URL.');
      return false;
    }

    const cleanName = (guestName || '').trim();
    if (!cleanName) {
      setJoinError('Por favor ingresa tu nombre para continuar.');
      return false;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const response = await fetch('/api/tables/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          qr_hash: qrHash,
          guest_name: cleanName,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 403) {
        const msg = 'Esta mesa ya envió su pedido';
        setJoinError(msg);
        if (showToast) showToast(msg, 'error');
        return false;
      }

      if (response.status === 404) {
        const msg = data?.message || 'Mesa no encontrada. Verifica el código QR.';
        setJoinError(msg);
        if (showToast) showToast(msg, 'error');
        return false;
      }

      if (!response.ok || !data?.ok) {
        const msg = data?.message || 'Error al unirse a la mesa. Intenta nuevamente.';
        setJoinError(msg);
        if (showToast) showToast(msg, 'error');
        return false;
      }

      // Si la mesa está ocupada y el usuario NO ha confirmado explícitamente ser del grupo
      if (data.role === 'guest' && !confirmAsGuest) {
        const hostName = data.host_name || currentHostName || 'el Anfitrión';
        setCurrentHostName(hostName);
        setIsJoining(false);
        return false;
      }

      // Respuesta exitosa: rol confirmado (host o guest autorizado)
      const sessionData = {
        qr_hash: qrHash,
        table_id: data.table_id,
        table_number: data.table_number || data.table_id,
        session_id: data.session_id,
        role: data.role || 'guest',
        guest_name: data.guest_name || cleanName,
        host_device_id: data.host_device_id || null,
        joined_at: new Date().toISOString(),
      };

      // Vaciar el carrito de compras local para iniciar la mesa desde cero
      try {
        localStorage.removeItem('cart');
        localStorage.removeItem('deliburrito_cart');
        localStorage.removeItem('deliburrito_cart_items');
        localStorage.removeItem('shopping_cart');
        if (typeof onClearCart === 'function') {
          onClearCart();
        }
      } catch (e) {
        console.warn('Error al vaciar carrito en localStorage:', e);
      }

      // Guardar en localStorage y en el estado
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      setTableSession(sessionData);
      setCurrentHostName(null);
      setIsTableModalOpen(false);
      setJoinError(null);

      const rolTexto = sessionData.role === 'host' ? 'Anfitrión' : 'Invitado';
      if (showToast) {
        showToast(`¡Bienvenido ${cleanName}! Mesa #${sessionData.table_number} (${rolTexto})`, 'success');
      }

      return true;
    } catch (err) {
      console.error('Error de red al unirse a la mesa:', err);
      const msg = 'Error de conexión con el servidor. Intenta nuevamente.';
      setJoinError(msg);
      if (showToast) showToast(msg, 'error');
      return false;
    } finally {
      setIsJoining(false);
    }
  }, [qrHash, currentHostName, showToast, onClearCart]);

  // 5. Función para tomar posesión de una mesa ocupada/abandonada (Override como Anfitrión)
  const overrideTable = useCallback(async (guestName) => {
    if (!qrHash) {
      setJoinError('No se encontró el código QR de la mesa en la URL.');
      return false;
    }

    const cleanName = (guestName || '').trim();
    if (!cleanName) {
      setJoinError('Por favor ingresa tu nombre para continuar.');
      return false;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const response = await fetch('/api/tables/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          qr_hash: qrHash,
          guest_name: cleanName,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 403) {
        const msg = data?.message || 'Hay un pedido en curso, pide al cajero que libere la mesa.';
        setJoinError(msg);
        if (showToast) showToast(msg, 'error');
        return false;
      }

      if (response.status === 404) {
        const msg = data?.message || 'Mesa no encontrada. Verifica el código QR.';
        setJoinError(msg);
        if (showToast) showToast(msg, 'error');
        return false;
      }

      if (!response.ok || !data?.ok) {
        const msg = data?.message || 'Error al reiniciar la mesa. Intenta nuevamente.';
        setJoinError(msg);
        if (showToast) showToast(msg, 'error');
        return false;
      }

      // Respuesta exitosa HTTP 200 con nuevo rol 'host'
      const sessionData = {
        qr_hash: qrHash,
        table_id: data.table_id,
        table_number: data.table_number || data.table_id,
        session_id: data.session_id,
        role: 'host',
        guest_name: data.guest_name || cleanName,
        host_device_id: data.host_device_id || null,
        joined_at: new Date().toISOString(),
      };

      // Vaciar el carrito de compras local para iniciar la mesa limpia desde cero
      try {
        localStorage.removeItem('cart');
        localStorage.removeItem('deliburrito_cart');
        localStorage.removeItem('deliburrito_cart_items');
        localStorage.removeItem('shopping_cart');
        if (typeof onClearCart === 'function') {
          onClearCart();
        }
      } catch (e) {
        console.warn('Error al vaciar carrito en localStorage:', e);
      }

      // Guardar en localStorage y en el estado
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      setTableSession(sessionData);
      setCurrentHostName(null);
      setIsTableModalOpen(false);
      setJoinError(null);

      if (showToast) {
        showToast(`¡Has tomado el control de la Mesa #${sessionData.table_number} como Anfitrión!`, 'success');
      }

      return true;
    } catch (err) {
      console.error('Error de red al tomar posesión de la mesa:', err);
      const msg = 'Error de conexión con el servidor. Intenta nuevamente.';
      setJoinError(msg);
      if (showToast) showToast(msg, 'error');
      return false;
    } finally {
      setIsJoining(false);
    }
  }, [qrHash, showToast, onClearCart]);

  return {
    tableSession,
    qrHash,
    isTableModalOpen,
    isJoining,
    joinError,
    currentHostName,
    joinTable,
    overrideTable,
    leaveTable,
    setIsTableModalOpen,
  };
}
