import React, { useState, useEffect, useCallback } from 'react';
import { 
  IoRestaurant, 
  IoPeople, 
  IoFastFood, 
  IoSparkles, 
  IoLockClosed, 
  IoArrowForward, 
  IoCheckmarkCircle, 
  IoTimeOutline,
  IoReceiptOutline,
  IoExitOutline,
  IoRefresh,
  IoTrashOutline,
  IoCreateOutline,
  IoWarningOutline,
  IoClose,
  IoEyeOutline
} from 'react-icons/io5';

// Helper para leer token CSRF
function getCsrfToken() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Lobby Multijugador (Mesa 2D interactiva).
 * - Muestra la mesa en 2D con los participantes sentados en sillas alrededor.
 * - Destaca con corona 👑 al Anfitrión (host).
 * - Short-polling cada 3 segundos a GET /api/tables/{session_id}/lobby.
 * - Botón gigante "Armar mi Comida" -> lleva a BurritoBuilder.
 * - Botón "Enviar Pedido a Cocina" exclusivo y habilitado para el Anfitrión.
 * - Permite editar y eliminar solo los productos armados por el comensal actual.
 */
export default function TableLobby({ 
  tableSession, 
  onGoToBuilder, 
  onEditItem,
  onSuccess, 
  onLeaveTable, 
  showToast 
}) {
  const [lobbyData, setLobbyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);

  const sessionId = tableSession?.session_id;
  const isHost = tableSession?.role === 'host';
  const myName = tableSession?.guest_name || '';

  // Abrir modal de confirmación para eliminar producto propio
  const handleDeleteItemClick = (item) => {
    setItemToDelete(item);
  };

  // Confirmar eliminación del producto desde el modal
  const confirmDeleteItem = async () => {
    if (!sessionId || !itemToDelete) return;
    const itemId = itemToDelete.id;

    setDeletingId(itemId);
    try {
      const res = await fetch(`/api/tables/cart/item/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          session_id: sessionId,
          guest_name: myName,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 403) {
        throw new Error(data?.message || 'No puedes modificar los productos de otra persona');
      }

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'Error al eliminar el producto');
      }

      setItemToDelete(null);
      if (showToast) showToast('Producto eliminado de la mesa', 'success');
      fetchLobby(false);
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      if (showToast) showToast(err.message || 'No se pudo eliminar el producto', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // 1. Consultar estado del Lobby
  const fetchLobby = useCallback(async (isInitial = false) => {
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/tables/${sessionId}/lobby`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 404 && typeof onLeaveTable === 'function') {
          onLeaveTable(true);
          return;
        }
        throw new Error('Error al consultar el lobby');
      }

      const data = await res.json();
      if (data.ok) {
        setLobbyData(data);
        setLastSync(new Date());
      }
    } catch (err) {
      console.warn('Error en polling del Lobby:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [sessionId, onLeaveTable]);

  // 2. Short-polling cada 3 segundos
  useEffect(() => {
    if (!sessionId) return;

    setLoading(true);
    fetchLobby(true);

    const intervalId = setInterval(() => {
      fetchLobby(false);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [sessionId, fetchLobby]);

  // 3. Enviar Pedido Consolidado a Cocina (solo Anfitrión)
  const handleSendToKitchen = async () => {
    if (!isHost) return;

    const cart = lobbyData?.cart;
    if (!cart?.items || cart.items.length === 0) {
      if (showToast) showToast('Aún no hay productos en la mesa para enviar.', 'error');
      return;
    }

    setIsSending(true);

    try {
      const formattedItems = cart.items.map(item => {
        let details = item.details;
        if (typeof details === 'string') {
          try {
            details = JSON.parse(details);
          } catch (e) {
            details = {};
          }
        }
        details = details || {};

        return {
          product_type: details.product_type || item.product?.slug || 'burrito',
          variation_name: details.variation_name || null,
          guest_name: item.guest_name,
          notes: `[Comensal: ${item.guest_name}] ${details.notes || ''}`.trim(),
          options: details.options || [],
          item_total: parseFloat(item.price) || 0,
          display_name: details.display_name || item.product?.name || 'Burrito',
          selection_summary: details.selection_summary || '',
        };
      });

      const tableNum = String(lobbyData?.table_number || tableSession.table_number || tableSession.table_id);

      const payload = {
        customer_name: `Mesa ${tableNum} (${tableSession.guest_name})`,
        customer_phone: 'Local',
        customer_address: 'Consumo en Sala / Mesa',
        table_number: tableNum,
        session_id: sessionId,
        delivery_type: 'local',
        observations: `Pedido consolidado de Mesa #${tableNum}. Anfitrión: ${tableSession.guest_name}`,
        items: formattedItems,
      };

      const response = await fetch('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Error al enviar pedido a cocina');
      }

      // 1. Mensaje de éxito llamativo
      if (showToast) showToast('¡Pedido enviado a cocina con éxito!', 'success');

      // 2. Resetear ítems locales para forzar re-renderizado inmediato
      setLobbyData(prev => prev ? { ...prev, items: [], cart_items: [] } : prev);

      // 3. Refrescar el lobby inmediatamente con el backend limpio
      await fetchLobby(true);
    } catch (err) {
      console.error('Error al enviar orden a cocina:', err);
      if (showToast) showToast(err.message || 'Error al enviar pedido a cocina', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // 4. Salir de la sala colaborativa (Abre el modal elegante en lugar de window.confirm)
  const handleLeaveClick = () => {
    setShowLeaveModal(true);
  };

  const confirmLeave = async () => {
    if (isLeaving) return;

    if (isHost) {
      setIsLeaving(true);
      try {
        const res = await fetch('/api/tables/leave', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': getCsrfToken(),
          },
          body: JSON.stringify({
            session_id: sessionId,
            host_device_id: tableSession?.host_device_id,
          }),
        });

        if (res.ok) {
          setShowLeaveModal(false);
          if (showToast) showToast('Mesa cerrada y liberada exitosamente.', 'info');
          if (typeof onLeaveTable === 'function') {
            onLeaveTable();
          }
        } else {
          const data = await res.json().catch(() => null);
          const errMsg = data?.message || 'Error al intentar liberar la mesa.';
          if (showToast) showToast(errMsg, 'error');
          // Si la mesa ya fue liberada o expiró (404), igualmente limpiar localmente
          if (res.status === 404 && typeof onLeaveTable === 'function') {
            setShowLeaveModal(false);
            onLeaveTable();
          }
        }
      } catch (err) {
        console.error('Error al liberar la mesa:', err);
        if (showToast) showToast('Error de conexión al liberar la mesa.', 'error');
      } finally {
        setIsLeaving(false);
      }
    } else {
      setShowLeaveModal(false);
      if (typeof onLeaveTable === 'function') {
        onLeaveTable();
      }
    }
  };

  const participants = lobbyData?.participants || [];
  const cart = lobbyData?.cart || { items: [], by_guest: {}, total_items: 0, total_price: 0 };
  const byGuest = cart.by_guest || {};
  const tableNum = lobbyData?.table_number || tableSession?.table_number || tableSession?.table_id;
  const hostName = lobbyData?.host_name || tableSession?.guest_name || 'Anfitrión';
  const lastOrder = lobbyData?.last_order || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-amber-50/30 flex flex-col items-center justify-between p-4 sm:p-6 pb-28">
      
      {/* ── HEADER DEL LOBBY ────────────────────────────────────────────── */}
      <header className="w-full max-w-4xl flex items-center justify-between py-3 px-4 sm:px-6 bg-white/90 backdrop-blur-md rounded-3xl shadow-md border-2 border-yellow-400 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-yellow-500 text-white flex items-center justify-center font-black text-xl shadow-md transform -rotate-3">
            🌯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-black text-gray-900 uppercase tracking-tight">
                Mesa #{tableNum}
              </h1>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                En vivo
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 font-semibold">
              Sala Multijugador • Deli Burrito
            </p>
          </div>
        </div>

        {/* Info del usuario actual y botón de salir */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <span className="block text-[11px] font-black uppercase text-gray-400 tracking-wider">
              Tu Nombre
            </span>
            <span className="text-xs font-black text-gray-800 flex items-center gap-1 justify-end">
              {isHost && <span>👑</span>}
              {myName}
            </span>
          </div>

          {onLeaveTable && (
            <button
              type="button"
              onClick={handleLeaveClick}
              disabled={isLeaving}
              title="Salir de la Mesa"
              className={`p-2 sm:px-3 sm:py-2 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1 border border-gray-200 ${
                isLeaving 
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' 
                  : 'text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50'
              }`}
            >
              <IoExitOutline className={`w-4 h-4 ${isLeaving ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isLeaving ? 'Saliendo...' : 'Salir'}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL: LA MESA 2D ────────────────────────────── */}
      <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center my-2 sm:my-4">
        
        {/* Banner informativo de bienvenida */}
        <div className="text-center mb-6 sm:mb-8 px-2">
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight uppercase mb-1">
            Lobby de la Mesa
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-md mx-auto">
            {participants.length <= 1 
              ? 'Eres el primero en llegar. Comparte el código QR con tus amigos para que se sienten contigo.' 
              : `Hay ${participants.length} comensales en la mesa ordenando en tiempo real.`
            }
          </p>
        </div>

        {/* ── ARENA 2D DE LA MESA Y SILLAS ──────────────────────────────── */}
        <div className="relative w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] flex items-center justify-center select-none mt-6 sm:mt-4 mb-2">
          
          {/* MESA CENTRAL (Madera / Gourmet) */}
          <div className="w-44 h-44 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-amber-100 via-amber-50 to-amber-200 border-[6px] sm:border-8 border-amber-800/40 shadow-2xl flex flex-col items-center justify-center text-center p-3 relative z-10 transition-transform duration-300">
            
            {/* Placa central de la mesa con logo */}
            <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-white/95 backdrop-blur-sm border-2 sm:border-4 border-yellow-400 shadow-inner flex flex-col items-center justify-center p-2">
              <span className="text-2xl sm:text-4xl mb-0.5 filter drop-shadow">🌯</span>
              <span className="text-xs sm:text-base font-black text-gray-900 tracking-tighter leading-none uppercase">
                Mesa {tableNum}
              </span>
              {cart.total_items > 0 ? (
                <span className="text-[9px] sm:text-[11px] font-bold text-red-600 mt-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  {cart.total_items} {cart.total_items === 1 ? 'ítem' : 'ítems'}
                </span>
              ) : lastOrder ? (
                <span className="text-[9px] sm:text-[10px] font-black text-emerald-800 mt-1 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow-xs animate-pulse">
                  <span>👨‍🍳</span>
                  <span>En Cocina</span>
                </span>
              ) : (
                <span className="text-[9px] sm:text-[11px] font-bold text-red-600 mt-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  0 ítems
                </span>
              )}
            </div>

            {/* Sutil halo decorativo */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-700/20 pointer-events-none" />
          </div>

          {/* SILLAS CON PARTICIPANTES ALREDEDOR DE LA MESA */}
          {participants.map((p, index) => {
            const total = Math.max(participants.length, 1);
            // Ángulo radial uniforme comenzando desde arriba (-90deg)
            const angle = (index / total) * (2 * Math.PI) - (Math.PI / 2);
            // Radio en porcentaje para distanciar las sillas alrededor de la mesa sin que choquen con el texto
            const radius = 40.5; // %
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            const isParticipantHost = p.role === 'host';
            const isMe = p.guest_name === myName;
            const guestItems = byGuest[p.guest_name] || [];
            const hasItems = guestItems.length > 0;

            return (
              <div 
                key={p.id || index}
                style={{ 
                  left: `${x}%`, 
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-20 flex flex-col items-center transition-all duration-500 animate-in zoom-in-75"
              >
                {/* Silla / Avatar circular */}
                <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-black shadow-xl ring-4 transition-transform hover:scale-110 ${
                  isParticipantHost
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-white ring-yellow-400'
                    : isMe
                    ? 'bg-gradient-to-tr from-red-600 to-red-500 text-white ring-red-400'
                    : 'bg-gradient-to-tr from-gray-700 to-gray-900 text-white ring-gray-300'
                }`}>
                  
                  {/* Corona para el Anfitrión */}
                  {isParticipantHost && (
                    <span 
                      title="Anfitrión"
                      className="absolute -top-2.5 -right-1 text-base sm:text-xl filter drop-shadow animate-bounce"
                    >
                      👑
                    </span>
                  )}

                  {/* Iniciales o ícono */}
                  <span className="text-xs sm:text-base font-black tracking-wider uppercase">
                    {(p.guest_name || 'U').substring(0, 2)}
                  </span>

                  {/* Indicador de estado de armado */}
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[9px] ${
                    hasItems ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950 animate-pulse'
                  }`} title={hasItems ? '¡Listo! Ya tiene productos' : 'Armando su comida...'}>
                    {hasItems ? '✓' : '⋯'}
                  </span>
                </div>

                {/* Nombre de la persona debajo de su silla */}
                <div className="mt-1 flex flex-col items-center">
                  <span className={`text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-full shadow-md border max-w-[85px] sm:max-w-[110px] truncate text-center ${
                    isMe 
                      ? 'bg-red-50 text-red-900 border-red-300 ring-2 ring-red-400/30' 
                      : 'bg-white/95 text-gray-800 border-gray-200'
                  }`}>
                    {p.guest_name} {isMe && '(Tú)'}
                  </span>

                  {/* Badge de estado de pedido */}
                  <span className={`text-[9px] font-bold mt-0.5 ${
                    hasItems ? 'text-emerald-700 font-black' : 'text-amber-600'
                  }`}>
                    {hasItems 
                      ? `${guestItems.length} ${guestItems.length === 1 ? 'burrito' : 'burritos'}`
                      : 'Armando...'
                    }
                  </span>
                </div>
              </div>
            );
          })}

          {/* Silla vacía decorativa si hay pocos comensales */}
          {participants.length === 1 && (
            <div 
              style={{ left: '50%', top: '93%', transform: 'translate(-50%, -50%)' }}
              className="absolute z-10 flex flex-col items-center opacity-40 hover:opacity-75 transition-opacity"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-gray-400 bg-gray-50 flex items-center justify-center text-gray-400">
                <IoPeople className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 mt-1">Silla Libre</span>
            </div>
          )}
        </div>

        {/* ── CARD PERSISTENTE DE RETROALIMENTACIÓN: PEDIDO EN COCINA ── */}
        {lastOrder && (
          <div className="w-full max-w-md mt-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-400/80 rounded-3xl p-4 sm:p-5 shadow-xl shadow-emerald-500/10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Decoración de fondo */}
            <div className="absolute -right-2 -bottom-2 text-emerald-200/50 text-7xl font-black pointer-events-none select-none">
              👨‍🍳
            </div>

            <div className="flex items-start gap-3.5 relative z-10">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-md shadow-emerald-600/30">
                {lastOrder.status === 'aceptado' ? '🔥' : '👨‍🍳'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-950">
                    Pedido #{lastOrder.id} en Cocina
                  </h3>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs ${
                    lastOrder.status === 'aceptado'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-400 text-amber-950 animate-pulse'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${lastOrder.status === 'aceptado' ? 'bg-white' : 'bg-amber-950'}`}></span>
                    {lastOrder.status === 'aceptado' ? 'En Preparación' : 'Recibido en Cocina'}
                  </span>
                </div>

                <p className="text-xs text-emerald-900/90 font-medium mt-1 leading-snug">
                  {lastOrder.status === 'aceptado'
                    ? '¡Tu comanda ya fue aceptada! Los cocineros están preparando y dorando los burritos en la plancha.'
                    : 'La comanda ya fue enviada y recibida con éxito por el personal de cocina.'}
                </p>

                <div className="flex items-center gap-2.5 mt-2.5 text-[11px] font-bold text-emerald-800 pt-2 border-t border-emerald-200/60 flex-wrap">
                  <span className="flex items-center gap-1">
                    <IoTimeOutline className="w-3.5 h-3.5 text-emerald-600" />
                    {lastOrder.time_formatted || lastOrder.time_ago || 'Hace un momento'}
                  </span>
                  <span>•</span>
                  <span>{lastOrder.items_count} {lastOrder.items_count === 1 ? 'producto' : 'productos'}</span>
                  <span>•</span>
                  <span className="font-black text-emerald-950">${Number(lastOrder.total).toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BOTONES DE ACCIÓN GIGANTES ─────────────────────────────────── */}
        <div className="w-full max-w-md space-y-3.5 mt-4 sm:mt-5 px-2">
          
          {/* BOTÓN GIGANTE: ARMAR MI COMIDA */}
          <button
            type="button"
            onClick={onGoToBuilder}
            className="w-full py-4 sm:py-5 px-6 bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 hover:from-red-500 hover:to-yellow-400 text-white rounded-3xl font-black text-lg sm:text-2xl uppercase tracking-wider shadow-2xl shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border-2 border-yellow-300"
          >
            <span className="text-2xl sm:text-3xl filter drop-shadow">🌯</span>
            <span>Armar mi Comida</span>
            <IoArrowForward className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* BOTÓN: ENVIAR PEDIDO A COCINA (CONDICIONAL POR ROL Y ESTADO) */}
          {isHost ? (
            cart.total_items === 0 && lastOrder ? (
              <div className="w-full py-4 px-6 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 bg-emerald-100/90 text-emerald-900 border-2 border-emerald-300 shadow-sm text-center">
                <IoCheckmarkCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Pedido #{lastOrder.id} enviado a cocina con éxito</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSending || cart.total_items === 0}
                onClick={handleSendToKitchen}
                className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all ${
                  cart.total_items === 0 || isSending
                    ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/30 active:scale-[0.98]'
                }`}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Enviando Pedido a Cocina...
                  </>
                ) : (
                  <>
                    <span>👨‍🍳</span>
                    <span>
                      {lastOrder && cart.total_items > 0
                        ? `Enviar Siguiente Ronda (${cart.total_items})`
                        : `Enviar Pedido a Cocina (${cart.total_items})`
                      }
                    </span>
                  </>
                )}
              </button>
            )
          ) : (
            cart.total_items === 0 && lastOrder ? (
              <div className="w-full py-3.5 px-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center flex items-center justify-center gap-2.5 text-emerald-900 shadow-sm">
                <IoCheckmarkCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-wider leading-none">
                    ¡{hostName} ya envió el pedido #{lastOrder.id} a cocina!
                  </p>
                  <p className="text-[11px] text-emerald-700/90 font-medium mt-0.5">
                    Tu comida ya está registrada. Podés armar más comida si deseás otra ronda.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full py-3.5 px-4 bg-amber-50 border-2 border-amber-200 rounded-2xl text-center flex items-center justify-center gap-2.5 text-amber-900 shadow-sm">
                <IoLockClosed className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-wider leading-none">
                    Esperando que {hostName} envíe a cocina...
                  </p>
                  <p className="text-[11px] text-amber-700/80 font-medium mt-0.5">
                    Solo el Anfitrión puede despachar el pedido consolidado.
                  </p>
                </div>
              </div>
            )
          )}
        </div>

        {/* ── RESUMEN DEL PEDIDO CONSOLIDADO DE LA MESA ─────────────────── */}
        {cart.total_items > 0 && (
          <div className="w-full max-w-md mt-6 bg-white rounded-3xl p-5 shadow-lg border-2 border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <IoReceiptOutline className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                  En la Mesa ({cart.total_items} {cart.total_items === 1 ? 'ítem' : 'ítems'})
                </h3>
              </div>
              <span className="text-base font-black text-red-600">
                ${Number(cart.total_price || 0).toLocaleString('es-CO')}
              </span>
            </div>

            {/* Desglose por comensal */}
            <div className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {Object.entries(byGuest).map(([guest, items]) => (
                <div key={guest} className="bg-gray-50 rounded-2xl p-2.5 border border-gray-100 text-xs">
                  <div className="flex items-center justify-between font-black text-gray-800 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                      {guest} {guest === myName && '(Tú)'}
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      {items.length} {items.length === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                  <ul className="space-y-1.5 pl-1 text-gray-600">
                    {items.map((it, idx) => {
                      const isMine = it.guest_name === myName || guest === myName;
                      return (
                        <li 
                          key={it.id || idx} 
                          className="flex items-center justify-between py-2 sm:py-2.5 px-3 bg-white hover:bg-amber-50/70 rounded-2xl border border-gray-100 hover:border-amber-300 text-xs gap-2 shadow-xs transition-all"
                        >
                          <div 
                            onClick={() => setSelectedItemDetail(it)}
                            className="flex-1 min-w-0 pr-1 cursor-pointer group"
                            title="Toca para ver el detalle de los ingredientes"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-800 group-hover:text-amber-900 block truncate text-xs sm:text-sm transition-colors">
                                {it.details?.display_name || it.product?.name || 'Burrito'}
                              </span>
                              <span className="text-[10px] text-amber-600 font-bold opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                <IoEyeOutline className="w-3 h-3" /> Ver
                              </span>
                            </div>
                            {it.details?.selection_summary && (
                              <span className="text-[10px] sm:text-[11px] text-gray-400 group-hover:text-gray-600 block truncate leading-tight mt-0.5">
                                {it.details.selection_summary}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className="font-black text-gray-800 text-xs sm:text-sm">
                              ${Number(it.price).toLocaleString('es-CO')}
                            </span>

                            {/* Solo visible para el autor del producto: botones al doble de tamaño para toque fácil */}
                            {isMine && (
                              <div className="flex items-center gap-1.5 ml-1">
                                <button
                                  type="button"
                                  onClick={() => onEditItem && onEditItem(it)}
                                  title="Editar mi producto"
                                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-900 rounded-xl border border-amber-200 shadow-sm transition-all active:scale-90"
                                >
                                  <IoCreateOutline className="w-5 h-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItemClick(it)}
                                  disabled={deletingId === it.id}
                                  title="Eliminar de la mesa"
                                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 rounded-xl border border-red-200 shadow-sm transition-all active:scale-90 disabled:opacity-50"
                                >
                                  <IoTrashOutline className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer discreto */}
      <footer className="text-center text-[11px] text-gray-400 font-semibold mt-4">
        Deli Burrito • Sincronización colaborativa cada 3 segundos
      </footer>

      {/* ── MODAL ELEGANTE DE CONFIRMACIÓN DE SALIDA (TAILWIND) ───────────── */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden transform animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Botón X superior para cerrar */}
            <button
              type="button"
              onClick={() => setShowLeaveModal(false)}
              disabled={isLeaving}
              aria-label="Cerrar modal"
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <IoClose className="w-5 h-5" />
            </button>

            {/* Cabecera del modal */}
            <div className={`p-6 text-center ${isHost ? 'bg-gradient-to-b from-red-50 to-white' : 'bg-gradient-to-b from-amber-50 to-white'}`}>
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-md ${
                isHost 
                  ? 'bg-red-100 text-red-600 border border-red-200' 
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
                {isHost ? (
                  <IoWarningOutline className="w-9 h-9 text-red-600 animate-pulse" />
                ) : (
                  <IoExitOutline className="w-8 h-8 text-amber-700" />
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {isHost ? '¿Deseas cerrar la mesa?' : '¿Abandonar la mesa?'}
              </h3>
              
              <p className="mt-3 text-sm text-gray-600 font-medium leading-relaxed px-2">
                {isHost
                  ? 'Al salir, cerrarás la mesa para todos los invitados y se cancelará el pedido en curso. ¿Estás seguro de que deseas salir?'
                  : '¿Deseas abandonar la mesa? Tu sesión actual se cerrará, pero la mesa continuará para los demás.'}
              </p>

              {isHost && (
                <div className="mt-4 p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-700 font-bold flex items-center gap-2 text-left">
                  <span className="text-base flex-shrink-0">⚠️</span>
                  <span>Esta acción eliminará el carrito grupal y liberará la Mesa #{tableNum} para nuevos clientes.</span>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                disabled={isLeaving}
                className="flex-1 py-3 px-4 bg-white hover:bg-gray-100 text-gray-700 font-black text-sm rounded-2xl border border-gray-300 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmLeave}
                disabled={isLeaving}
                className={`flex-1 py-3 px-4 font-black text-sm rounded-2xl text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isHost
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-200'
                    : 'bg-gradient-to-r from-gray-800 to-black hover:from-black hover:to-gray-900'
                } disabled:opacity-50`}
              >
                {isLeaving ? (
                  <>
                    <IoRefresh className="w-4 h-4 animate-spin" />
                    <span>Liberando...</span>
                  </>
                ) : (
                  <>
                    <IoExitOutline className="w-4 h-4" />
                    <span>{isHost ? 'Sí, cerrar mesa' : 'Sí, abandonar'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ELEGANTE PARA ELIMINAR PRODUCTO (TAILWIND) ──────────────── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden transform animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Botón X superior para cerrar */}
            <button
              type="button"
              onClick={() => setItemToDelete(null)}
              disabled={deletingId === itemToDelete.id}
              aria-label="Cerrar modal"
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <IoClose className="w-5 h-5" />
            </button>

            {/* Cabecera del modal */}
            <div className="p-6 text-center bg-gradient-to-b from-red-50 to-white">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center mb-3 shadow-md">
                <IoTrashOutline className="w-8 h-8 text-red-600 animate-pulse" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                ¿Eliminar producto?
              </h3>
              
              <p className="mt-2 text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                ¿Estás seguro de que deseas quitar este producto de la mesa?
              </p>

              {/* Tarjeta del producto a eliminar */}
              <div className="mt-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-left">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-black text-gray-900 text-sm block">
                    {itemToDelete.details?.display_name || itemToDelete.product?.name || 'Burrito'}
                  </span>
                  <span className="font-black text-red-600 text-sm whitespace-nowrap">
                    ${Number(itemToDelete.price).toLocaleString('es-CO')}
                  </span>
                </div>
                {itemToDelete.details?.selection_summary && (
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-tight">
                    {itemToDelete.details.selection_summary}
                  </p>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deletingId === itemToDelete.id}
                className="flex-1 py-3 px-4 bg-white hover:bg-gray-100 text-gray-700 font-black text-sm rounded-2xl border border-gray-300 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDeleteItem}
                disabled={deletingId === itemToDelete.id}
                className="flex-1 py-3 px-4 font-black text-sm rounded-2xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deletingId === itemToDelete.id ? (
                  <>
                    <IoRefresh className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <IoTrashOutline className="w-4 h-4" />
                    <span>Sí, eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle Rápido del Pedido (Inspección rápida antes de enviar) */}
      {selectedItemDetail && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedItemDetail(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-amber-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado */}
            <div className="relative p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30">
                  🌯
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100 block">
                    Detalle del Pedido
                  </span>
                  <h3 className="text-lg font-black leading-tight text-white">
                    {selectedItemDetail.details?.display_name || selectedItemDetail.product?.name || 'Burrito'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-white/25 px-2 py-0.5 rounded-full font-bold">
                      👤 {selectedItemDetail.guest_name || 'Comensal'} {selectedItemDetail.guest_name === myName && '(Tú)'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
                aria-label="Cerrar modal"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido / Ingredientes */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Precio Total */}
              <div className="flex items-center justify-between p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/60">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Precio Total
                </span>
                <span className="text-lg font-black text-amber-950">
                  ${Number(selectedItemDetail.price).toLocaleString('es-CO')}
                </span>
              </div>

              {/* Lista de ingredientes / selección */}
              <div>
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <IoSparkles className="w-3.5 h-3.5 text-amber-500" />
                  Ingredientes & Opciones Seleccionadas
                </h4>
                
                {selectedItemDetail.details?.selection_summary ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItemDetail.details.selection_summary
                      .split(/,\s*/)
                      .filter(Boolean)
                      .map((ingredient, i) => (
                        <span 
                          key={i}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl border border-gray-200 transition-colors"
                        >
                          {ingredient}
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Sin ingredientes o detalles especificados.
                  </p>
                )}
              </div>

              {/* Notas especiales si hay */}
              {selectedItemDetail.details?.notes && (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-600 mb-1">Notas especiales:</h4>
                  <p className="text-xs text-gray-700 italic">"{selectedItemDetail.details.notes}"</p>
                </div>
              )}
            </div>

            {/* Footer con acciones */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
              {selectedItemDetail.guest_name === myName ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const it = selectedItemDetail;
                      setSelectedItemDetail(null);
                      if (typeof handleDeleteItemClick === 'function') {
                        handleDeleteItemClick(it);
                      }
                    }}
                    className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl border border-red-200 transition-all font-bold text-xs flex items-center justify-center gap-1.5"
                    title="Eliminar este burrito"
                  >
                    <IoTrashOutline className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const it = selectedItemDetail;
                      setSelectedItemDetail(null);
                      if (typeof onEditItem === 'function') {
                        onEditItem(it);
                      }
                    }}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCreateOutline className="w-4 h-4" />
                    <span>Editar mi Burrito</span>
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between gap-3">
                  <span className="text-[11px] text-gray-500 font-medium">
                    🔒 Solo <strong className="text-gray-700">{selectedItemDetail.guest_name}</strong> puede modificarlo.
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedItemDetail(null)}
                    className="py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
