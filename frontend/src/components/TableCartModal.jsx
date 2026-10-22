import React, { useState, useEffect, useCallback } from 'react';
import { 
  IoClose, 
  IoRestaurant, 
  IoPerson, 
  IoTimeOutline, 
  IoCheckmarkCircle, 
  IoSparkles, 
  IoReceiptOutline,
  IoSync,
  IoTrashOutline,
  IoCreateOutline
} from 'react-icons/io5';

// Helper para leer token CSRF
function getCsrfToken() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Modal / Drawer de Carrito Colaborativo para Salas de Mesa.
 * - Muestra los productos de toda la mesa agrupados por guest_name.
 * - Short-polling cada 3 segundos a GET /api/tables/cart/{session_id}.
 * - Control de permisos por rol:
 *   * Guest: Botón deshabilitado "Esperando que el Anfitrión envíe...".
 *   * Host: Botón activo "Enviar Pedido a Cocina", directo al backend sin pasar por formulario de domicilio.
 * - Permite editar y eliminar solo los productos propios del usuario actual.
 */
export default function TableCartModal({
  isOpen,
  onClose,
  tableSession,
  onSuccess,
  onBackToLobby,
  showToast,
  onItemCountChange,
  onEditItem,
}) {
  const [cartData, setCartData] = useState({
    items: [],
    by_guest: {},
    total_items: 0,
    total_price: 0,
    table: {},
  });
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Abrir modal de confirmación para eliminar producto propio
  const handleDeleteItemClick = (item) => {
    setItemToDelete(item);
  };

  // Confirmar eliminación del producto desde el modal
  const confirmDeleteItem = async () => {
    if (!tableSession?.session_id || !itemToDelete) return;
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
          session_id: tableSession.session_id,
          guest_name: tableSession.guest_name,
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
      showToast('Producto eliminado de la mesa', 'success');
      fetchTableCart(false);
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      showToast(err.message || 'No se pudo eliminar el producto', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // 1. Fetch de productos de la mesa
  const fetchTableCart = useCallback(async (isInitial = false) => {
    if (!tableSession?.session_id) return;

    try {
      const res = await fetch(`/api/tables/cart/${tableSession.session_id}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Error al consultar carrito de la mesa');
      }

      const data = await res.json();
      if (data.ok) {
        setCartData({
          items: data.items || [],
          by_guest: data.by_guest || {},
          total_items: data.total_items || 0,
          total_price: data.total_price || 0,
          table: data.table || {},
        });
        setLastSync(new Date());
        if (onItemCountChange) {
          onItemCountChange(data.total_items || 0);
        }
      }
    } catch (err) {
      console.warn('Error en polling de mesa:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [tableSession?.session_id, onItemCountChange]);

  // 2. Short-polling cada 3 segundos mientras el modal esté abierto
  useEffect(() => {
    if (!isOpen || !tableSession?.session_id) return;

    setLoading(true);
    fetchTableCart(true);

    const intervalId = setInterval(() => {
      fetchTableCart(false);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isOpen, tableSession?.session_id, fetchTableCart]);

  // 3. Enviar pedido a cocina (solo anfitrión)
  const handleSendToKitchen = async () => {
    if (tableSession?.role !== 'host') return;

    if (!cartData.items || cartData.items.length === 0) {
      showToast('Aún no hay productos en la mesa para enviar', 'error');
      return;
    }

    setIsSending(true);

    try {
      // Mapear ítems de la mesa al formato esperado por el backend de órdenes
      const formattedItems = cartData.items.map(item => {
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
          notes: `[Comensal: ${item.guest_name}] ${details.notes || ''}`.trim(),
          options: details.options || [],
          item_total: parseFloat(item.price) || 0,
          display_name: details.display_name || item.product?.name || 'Burrito',
          selection_summary: details.selection_summary || '',
        };
      });

      const payload = {
        customer_name: `Mesa ${tableSession.table_number || tableSession.table_id} (${tableSession.guest_name})`,
        customer_phone: 'Local',
        customer_address: 'Consumo en Sala / Mesa',
        table_number: String(tableSession.table_number || tableSession.table_id),
        session_id: tableSession?.session_id,
        delivery_type: 'local',
        observations: `Pedido consolidado de Mesa #${tableSession.table_number || tableSession.table_id}. Anfitrión: ${tableSession.guest_name}`,
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
      showToast('¡Pedido enviado a cocina con éxito!', 'success');

      // 2. Resetear estado local para forzar re-renderizado
      setCartData({
        items: [],
        by_guest: {},
        total_items: 0,
        total_price: 0,
        table: {},
      });
      if (onItemCountChange) onItemCountChange(0);

      // 3. Cerrar modal y volver a la vista del Lobby 2D
      onClose();

      if (onBackToLobby) {
        onBackToLobby();
      }
    } catch (err) {
      console.error('Error al enviar orden a cocina:', err);
      showToast(err.message || 'Error al enviar pedido a cocina', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const isHost = tableSession?.role === 'host';
  const guestsKeys = Object.keys(cartData.by_guest || {});

  return (
    <div className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-2xl w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl border-t-4 sm:border-4 border-yellow-400 relative overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* HEADER DEL MODAL */}
        <div className="px-6 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl border border-white/30">
              <IoReceiptOutline className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  Mesa #{tableSession?.table_number || tableSession?.table_id}
                </h2>
                <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  isHost 
                    ? 'bg-yellow-400 text-red-900 border-yellow-300' 
                    : 'bg-white/20 text-white border-white/30'
                }`}>
                  {isHost ? '👑 Anfitrión' : '👥 Invitado'}
                </span>
              </div>
              <p className="text-xs text-red-100 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Sala Colaborativa en Vivo (actualiza cada 3s)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95 text-white"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* LISTADO DE PRODUCTOS AGRUPADOS POR INVITADO */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-yellow-50/50">
          {loading && cartData.items.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <IoSync className="w-10 h-10 animate-spin mx-auto text-red-500 mb-3" />
              <p className="font-bold text-sm">Cargando productos de la mesa...</p>
            </div>
          ) : guestsKeys.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <span className="text-6xl mb-3 block">🌯</span>
              <h3 className="text-lg font-black text-gray-700 uppercase">La mesa está vacía</h3>
              <p className="text-xs font-semibold text-gray-400 mt-1 max-w-xs mx-auto">
                Arma tu primer burrito y agrégalo al carrito para que aparezca aquí con tu nombre.
              </p>
            </div>
          ) : (
            guestsKeys.map((guestName) => {
              const guestItems = cartData.by_guest[guestName] || [];
              const isCurrentUser = guestName.toLowerCase() === (tableSession?.guest_name || '').toLowerCase();
              const guestSubtotal = guestItems.reduce((acc, it) => acc + (parseFloat(it.price) || 0), 0);

              return (
                <div 
                  key={guestName} 
                  className={`bg-white rounded-3xl p-5 shadow-sm border transition-all ${
                    isCurrentUser ? 'border-red-200 ring-2 ring-red-100' : 'border-gray-100'
                  }`}
                >
                  {/* Encabezado del Comensal */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                        isCurrentUser 
                          ? 'bg-red-600 text-white' 
                          : 'bg-yellow-400 text-red-900'
                      }`}>
                        <IoPerson className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 text-base">
                            {guestName}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] font-black uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              Tú
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-gray-400">
                          {guestItems.length} {guestItems.length === 1 ? 'producto' : 'productos'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-400 block">Subtotal</span>
                      <span className="text-sm font-black text-gray-800">
                        ${guestSubtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Burritos del Comensal */}
                  <div className="space-y-3">
                    {guestItems.map((item) => {
                      let details = item.details;
                      if (typeof details === 'string') {
                        try { details = JSON.parse(details); } catch (e) { details = {}; }
                      }
                      details = details || {};

                      const displayName = details.display_name || item.product?.name || 'Burrito';
                      const summary = details.selection_summary || '';

                      return (
                        <div 
                          key={item.id} 
                          className="bg-gray-50 rounded-2xl p-3.5 flex justify-between items-start gap-3 border border-gray-100"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-black text-gray-800 truncate">
                                {displayName}
                              </span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                item.status === 'ready' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {item.status === 'ready' ? 'Listo' : 'Armado'}
                              </span>
                            </div>

                            {summary && (
                              <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed">
                                {summary}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-sm font-black text-red-600">
                              ${(parseFloat(item.price) || 0).toLocaleString()}
                            </span>

                            {isCurrentUser && (
                              <div className="flex items-center gap-1.5 ml-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onEditItem) {
                                      onClose();
                                      onEditItem(item);
                                    }
                                  }}
                                  title="Editar mi producto"
                                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-900 rounded-xl border border-amber-200 shadow-sm transition-all active:scale-90"
                                >
                                  <IoCreateOutline className="w-5 h-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItemClick(item)}
                                  disabled={deletingId === item.id}
                                  title="Eliminar de la mesa"
                                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 rounded-xl border border-red-200 shadow-sm transition-all active:scale-90 disabled:opacity-50"
                                >
                                  <IoTrashOutline className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER: TOTALES Y ACCIÓN SEGÚN ROL */}
        <div className="p-5 sm:p-6 bg-white border-t border-gray-100 space-y-4 shadow-lg">
          
          {/* Fila de Totales */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                Total de la Mesa
              </p>
              <p className="text-xs font-bold text-gray-500">
                {cartData.total_items} {cartData.total_items === 1 ? 'ítem en sala' : 'ítems en sala'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-red-600 tracking-tight">
                ${(parseFloat(cartData.total_price) || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* BOTÓN POR ROL (ANFITRIÓN VS INVITADO) */}
          {isHost ? (
            <div>
              <button
                type="button"
                onClick={handleSendToKitchen}
                disabled={isSending || cartData.items.length === 0}
                className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] ${
                  isSending || cartData.items.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-600/30'
                }`}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Enviando a cocina...
                  </>
                ) : (
                  <>
                    <IoRestaurant className="w-5 h-5" />
                    Enviar Pedido a Cocina
                  </>
                )}
              </button>
              <p className="text-[11px] text-gray-400 text-center font-bold mt-2">
                👑 Como Anfitrión, tú envías la comanda unificada directamente al personal.
              </p>
            </div>
          ) : (
            <div>
              <button
                type="button"
                disabled
                className="w-full py-4 bg-gray-100 border-2 border-gray-200 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2 shadow-inner"
              >
                <IoTimeOutline className="w-5 h-5 text-gray-400 animate-pulse" />
                Esperando que el Anfitrión envíe...
              </button>
              <p className="text-[11px] text-gray-400 text-center font-bold mt-2">
                👥 Tu burrito ya está en la sala. El anfitrión enviará el pedido cuando todos estén listos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ELEGANTE PARA ELIMINAR PRODUCTO (TAILWIND) ──────────────── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                    <IoSync className="w-4 h-4 animate-spin" />
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
    </div>
  );
}
