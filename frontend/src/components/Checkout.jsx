import React, { useState, useEffect, useCallback } from 'react';
import { 
  IoArrowBack, 
  IoTrashOutline, 
  IoInformationCircle, 
  IoFlame, 
  IoCopy, 
  IoPerson, 
  IoRestaurant, 
  IoTimeOutline, 
  IoSync, 
  IoReceiptOutline 
} from 'react-icons/io5';

import TableBadge from './TableBadge';

// ── Helper: lee el token CSRF de la cookie que Laravel establece ──────────
function getCsrfToken() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export default function Checkout({ cartItems, onBack, onSuccess, onBackToLobby, onRemoveItem, onDuplicateItem, showToast, tableSession }) {
  // ── ESTADO PARA MESAS COLABORATIVAS (MULTIJUGADOR) ──
  const [tableCartData, setTableCartData] = useState({
    items: [],
    by_guest: {},
    total_items: 0,
    total_price: 0,
    table: {},
  });
  const [loadingTableCart, setLoadingTableCart] = useState(true);
  const [sendingToKitchen, setSendingToKitchen] = useState(false);

  // ── ESTADO PARA PEDIDOS INDIVIDUALES / A DOMICILIO ──
  const [formData, setFormData] = useState({
    customer_name: tableSession?.guest_name || '',
    customer_phone: '',
    customer_address: '',
    table_number: tableSession ? String(tableSession.table_number || tableSession.table_id || '') : '',
    delivery_type: tableSession ? 'local' : 'domicilio',
    observations: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dbSettings, setDbSettings] = useState({ costo_domicilio: 5000 });

  // ── SHORT-POLLING CADA 3 SEGUNDOS PARA SALA DE MESA ──
  const fetchTableCart = useCallback(async (isInitial = false) => {
    if (!tableSession?.session_id) return;

    try {
      const res = await fetch(`/api/tables/cart/${tableSession.session_id}`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data?.ok) {
        setTableCartData({
          items: data.items || [],
          by_guest: data.by_guest || {},
          total_items: data.total_items || 0,
          total_price: data.total_price || 0,
          table: data.table || {},
        });
      }
    } catch (e) {
      console.warn('Error polling table cart:', e);
    } finally {
      if (isInitial) setLoadingTableCart(false);
    }
  }, [tableSession?.session_id]);

  useEffect(() => {
    if (!tableSession?.session_id) return;

    setLoadingTableCart(true);
    fetchTableCart(true);

    const intervalId = setInterval(() => {
      fetchTableCart(false);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [tableSession?.session_id, fetchTableCart]);

  // Cargar configuración de domicilio para pedidos normales
  useEffect(() => {
    if (tableSession) return;
    fetch('/public-config')
      .then(res => res.json())
      .then(data => {
        const delivery = data.find(s => s.key === 'costo_domicilio');
        if (delivery) {
          setDbSettings({ costo_domicilio: parseInt(delivery.value) });
        }
      })
      .catch(() => {});
  }, [tableSession]);

  // ── ENVIAR PEDIDO A COCINA (SOLO ANFITRIÓN - SALTA FORMULARIO DE ENVÍO) ──
  const handleSendOrderToKitchen = async () => {
    if (tableSession?.role !== 'host') return;

    if (!tableCartData.items || tableCartData.items.length === 0) {
      showToast('Aún no hay productos en la mesa para enviar', 'error');
      return;
    }

    setSendingToKitchen(true);

    try {
      const formattedItems = tableCartData.items.map(item => {
        let details = item.details;
        if (typeof details === 'string') {
          try { details = JSON.parse(details); } catch (e) { details = {}; }
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

      // 2. Resetear estado local de ítems para forzar re-renderizado
      setTableCartData({
        items: [],
        by_guest: {},
        total_items: 0,
        total_price: 0,
        table: {},
      });

      // 3. Redirección visual de vuelta a la vista del Lobby 2D
      if (onBackToLobby) {
        onBackToLobby();
      } else if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error('Error al enviar orden a cocina:', err);
      showToast(err.message || 'Error al enviar pedido a cocina', 'error');
    } finally {
      setSendingToKitchen(false);
    }
  };

  // ── MODO SALA DE MESA COLABORATIVA ─────────────────────────────────────────
  if (tableSession) {
    const isHost = tableSession.role === 'host';
    const guestsKeys = Object.keys(tableCartData.by_guest || {});

    return (
      <div className="min-h-screen bg-yellow-50 p-4 pb-16 font-sans">
        <div className="max-w-3xl mx-auto">
          
          {/* HEADER COMPACTO */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack} 
                className="p-3 bg-white rounded-full shadow-md text-xl hover:bg-gray-100 transition-all text-red-600 active:scale-95"
                title="Volver al menú"
              >
                <IoArrowBack className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-red-600 uppercase tracking-tighter">
                  Carrito de Mesa #{tableSession.table_number || tableSession.table_id}
                </h1>
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Sincronización en vivo cada 3s
                </p>
              </div>
            </div>

            <TableBadge session={tableSession} />
          </div>

          {/* LISTADO DE PRODUCTOS AGRUPADOS POR INVITADO */}
          <div className="space-y-5 mb-8">
            {loadingTableCart && tableCartData.items.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-100">
                <IoSync className="w-10 h-10 animate-spin mx-auto text-red-500 mb-3" />
                <p className="font-bold text-gray-500 text-sm">Cargando los pedidos de la mesa...</p>
              </div>
            ) : guestsKeys.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-100">
                <span className="text-6xl mb-3 block">🌯</span>
                <h3 className="text-xl font-black text-gray-800 uppercase">Aún no hay productos en la mesa</h3>
                <p className="text-sm font-semibold text-gray-400 mt-2 max-w-sm mx-auto">
                  Regresa al menú y arma tu burrito para agregarlo a la sala colaborativa.
                </p>
                <button
                  onClick={onBack}
                  className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase rounded-2xl shadow-lg shadow-red-600/30 active:scale-95 transition-all inline-flex items-center gap-2"
                >
                  <IoArrowBack className="w-4 h-4" /> Armar mi burrito
                </button>
              </div>
            ) : (
              guestsKeys.map((guestName) => {
                const guestItems = tableCartData.by_guest[guestName] || [];
                const isCurrentUser = guestName.toLowerCase() === (tableSession.guest_name || '').toLowerCase();
                const guestSubtotal = guestItems.reduce((acc, it) => acc + (parseFloat(it.price) || 0), 0);

                return (
                  <div 
                    key={guestName}
                    className={`bg-white rounded-[2rem] p-6 shadow-md border transition-all ${
                      isCurrentUser ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100'
                    }`}
                  >
                    {/* Encabezado del Comensal */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm ${
                          isCurrentUser 
                            ? 'bg-red-600 text-white' 
                            : 'bg-yellow-400 text-red-900'
                        }`}>
                          <IoPerson className="w-5 h-5" />
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
                          <span className="text-xs font-bold text-gray-400">
                            {guestItems.length} {guestItems.length === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-400 block">Subtotal</span>
                        <span className="text-base font-black text-gray-800">
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
                            className="bg-gray-50 rounded-2xl p-4 flex justify-between items-start gap-4 border border-gray-100 hover:border-red-100 transition-all"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm sm:text-base font-black text-gray-800 truncate">
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
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                  {summary}
                                </p>
                              )}
                            </div>

                            <span className="text-base font-black text-red-600 shrink-0">
                              ${(parseFloat(item.price) || 0).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* CARD DE TOTAL Y ACCIÓN POR ROL (ANFITRIÓN VS INVITADO) */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border-4 border-yellow-400 space-y-6">
            <div className="flex items-end justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-black uppercase text-gray-400 tracking-wider block">
                  Total de la Mesa
                </span>
                <span className="text-sm font-bold text-gray-500">
                  {tableCartData.total_items} {tableCartData.total_items === 1 ? 'producto en total' : 'productos en total'}
                </span>
              </div>
              <span className="text-3xl sm:text-4xl font-black text-red-600 tracking-tight">
                ${(parseFloat(tableCartData.total_price) || 0).toLocaleString()}
              </span>
            </div>

            {/* BOTÓN POR ROL */}
            {isHost ? (
              <div>
                <button
                  type="button"
                  onClick={handleSendOrderToKitchen}
                  disabled={sendingToKitchen || tableCartData.items.length === 0}
                  className={`w-full py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] ${
                    sendingToKitchen || tableCartData.items.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-600/30 hover:shadow-green-600/50 cursor-pointer'
                  }`}
                >
                  {sendingToKitchen ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Enviando comanda a cocina...
                    </>
                  ) : (
                    <>
                      <IoRestaurant className="w-6 h-6" />
                      Enviar Pedido a Cocina
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center font-bold mt-3">
                  👑 Como Anfitrión, al hacer clic enviarás todos los burritos de la mesa directamente a cocina sin formularios adicionales.
                </p>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  disabled
                  className="w-full py-4 sm:py-5 bg-gray-100 border-2 border-gray-200 text-gray-400 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-3 shadow-inner"
                >
                  <IoTimeOutline className="w-5 h-5 text-gray-400 animate-pulse" />
                  Esperando que el Anfitrión envíe...
                </button>
                <p className="text-xs text-gray-400 text-center font-bold mt-3">
                  👥 Tu burrito ya está registrado en la mesa. El anfitrión enviará la orden consolidada en cuanto todos terminen.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ── MODO PEDIDO NORMAL (A DOMICILIO / RECOGER SIN MESA) ───────────────────
  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.item_total) || 0), 0);
  const deliveryCost = formData.delivery_type === 'domicilio' ? dbSettings.costo_domicilio : 0;
  const total = subtotal + deliveryCost;

  const getItemNumber = (item, index) => {
    const itemsOfSameType = cartItems.filter((i, idx) => 
      idx <= index && i.product_type === item.product_type
    );
    return itemsOfSameType.length;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return showToast('No hay productos en el carrito', 'error');
    
    setLoading(true);
    setError(null);

    try {
      const payload = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        table_number: formData.table_number,
        session_id: tableSession?.session_id,
        delivery_type: formData.delivery_type,
        observations: formData.observations,
        items: cartItems,
      };

      const response = await fetch('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar el pedido');
      }

      showToast('¡Pedido enviado a cocina con éxito!', 'success');

      if (tableSession) {
        setTableCartData({
          items: [],
          by_guest: {},
          total_items: 0,
          total_price: 0,
          table: {},
        });
        if (onBackToLobby) {
          onBackToLobby();
        } else if (onBack) {
          onBack();
        }
      } else {
        onSuccess(result.order_id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 p-4 pb-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER COMPACTO */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-3 bg-white rounded-full shadow-md text-xl hover:bg-gray-100 transition-all"><IoArrowBack className="w-5 h-5 text-red-600" /></button>
              <h1 className="text-3xl font-black text-red-600 uppercase tracking-tighter">Tu Pedido</h1>
            </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          
          {/* RESUMEN DEL CARRITO (IZQUIERDA) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100">
                <h2 className="text-xl font-black mb-6 border-b border-gray-100 pb-2">RESUMEN</h2>
                <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.length === 0 ? (
                    <p className="text-gray-400 font-bold text-center py-4 italic">El carrito está vacío</p>
                ) : (
                    cartItems.map((item, idx) => {
                        const itemNumber = getItemNumber(item, idx);
                        const productLabel = `${item.product_type.toUpperCase()} #${String(itemNumber).padStart(2, '0')}`;
                        
                        return (
                        <div key={item.id} className="relative group bg-gray-50 p-4 rounded-3xl border border-transparent hover:border-red-100 transition-all">
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                                <p className="font-black text-gray-800 text-sm leading-tight mb-1">
                                    <span className="inline-block bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] mr-2">{productLabel}</span>
                                    {item.display_name}
                                </p>
                                <p className="text-[10px] text-gray-500 line-clamp-2">{item.selection_summary}</p>
                                <p className="text-red-600 font-black text-sm mt-2">${(parseFloat(item.item_total) || 0).toLocaleString()}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => onRemoveItem(item.id)}
                                    className="bg-red-100 text-red-600 px-3 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm font-bold text-xs flex items-center gap-1"
                                    title="Eliminar ítem"
                                >
                                    <IoTrashOutline className="w-3.5 h-3.5" /> Eliminar
                                </button>
                                <button 
                                    onClick={() => onDuplicateItem(item.id)}
                                    className="bg-blue-100 text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm font-bold text-xs flex items-center gap-1"
                                    title="Duplicar ítem"
                                >
                                    <IoCopy className="w-3.5 h-3.5" /> Duplicar
                                </button>
                            </div>
                        </div>
                        </div>
                    )})
                )}
                </div>

                <div className="border-t-2 border-dashed border-gray-200 pt-6 space-y-3">
                <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-400">SUBTOTAL</span>
                    <span className="text-gray-800">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-400">ENVÍO</span>
                    <span className="text-gray-800">${deliveryCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-gray-100">
                    <span className="text-xs font-black text-gray-400">TOTAL</span>
                    <span className="text-3xl font-black text-red-600 tracking-tighter">${total.toLocaleString()}</span>
                </div>
                </div>
            </div>
          </div>

          {/* FORMULARIO DE PAGO PARA DOMICILIO (DERECHA) */}
          <div className="lg:col-span-3">
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border-4 border-yellow-400">
                <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-gray-500">Datos de Entrega</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">¿Cómo te llamás?</label>
                        <input
                        type="text"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleChange}
                        required
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-600 outline-none transition-all font-bold"
                        placeholder="Nombre completo"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Teléfono de contacto</label>
                        <input
                        type="tel"
                        name="customer_phone"
                        value={formData.customer_phone}
                        onChange={handleChange}
                        required
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-600 outline-none transition-all font-bold"
                        placeholder="Ej: 310 123 4567"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">¿Cómo lo querés?</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['domicilio', 'local', 'recoger'].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, delivery_type: type }))}
                                className={`p-3 rounded-2xl font-black text-[10px] uppercase transition-all border-2 ${
                                    formData.delivery_type === type 
                                    ? 'bg-red-600 text-white border-red-600 shadow-lg' 
                                    : 'bg-white text-gray-400 border-gray-100 hover:border-red-200'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {formData.delivery_type === 'local' && (
                    <div className="animate-in slide-in-from-top duration-300">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Número de mesa</label>
                        <input
                            type="text"
                            name="table_number"
                            value={formData.table_number}
                            onChange={handleChange}
                            required
                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-600 outline-none transition-all font-bold"
                            placeholder="Ej: 5"
                        />
                    </div>
                )}

                {formData.delivery_type === 'domicilio' && (
                    <div className="animate-in slide-in-from-top duration-300">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Dirección de entrega</label>
                        <input
                            type="text"
                            name="customer_address"
                            value={formData.customer_address}
                            onChange={handleChange}
                            required
                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-600 outline-none transition-all font-bold"
                            placeholder="Calle, número, barrio, etc."
                        />
                    </div>
                )}

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Observaciones</label>
                    <textarea
                        name="observations"
                        value={formData.observations}
                        onChange={handleChange}
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-600 outline-none transition-all font-bold resize-none h-24"
                        placeholder="Ej: Sin cebolla, extra picante, etc."
                    />
                </div>

                {error && (
                    <div className="p-4 bg-red-100 border border-red-200 text-red-600 rounded-2xl font-bold text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || cartItems.length === 0}
                    className="w-full p-5 bg-red-600 text-white rounded-2xl font-black text-xl hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'ENVIANDO...' : 'CONFIRMAR PEDIDO'}
                </button>
                </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
