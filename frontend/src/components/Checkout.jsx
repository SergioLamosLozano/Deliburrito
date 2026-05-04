import React, { useState } from 'react';

export default function Checkout({ cartItems, onBack, onSuccess, onRemoveItem, showToast }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    delivery_type: 'domicilio',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dbSettings, setDbSettings] = useState({ costo_domicilio: 5000 });

  React.useEffect(() => {
    fetch('/settings')
      .then(res => res.json())
      .then(data => {
        const delivery = data.find(s => s.key === 'costo_domicilio');
        if (delivery) {
          setDbSettings({ costo_domicilio: parseInt(delivery.value) });
        }
      });
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.item_total) || 0), 0);
  const deliveryCost = formData.delivery_type === 'domicilio' ? dbSettings.costo_domicilio : 0;
  const total = subtotal + deliveryCost;

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
        delivery_type: formData.delivery_type,
        items: cartItems,
      };

      const response = await fetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar el pedido');
      }

      onSuccess(result.order_id);
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
        <div className="flex items-center gap-4 mb-8">
            <button onClick={onBack} className="p-3 bg-white rounded-full shadow-md text-xl hover:bg-gray-100 transition-all">⬅</button>
            <h1 className="text-3xl font-black text-red-600 uppercase tracking-tighter">Tu Pedido</h1>
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
                    cartItems.map((item, idx) => (
                        <div key={item.id} className="relative group bg-gray-50 p-4 rounded-3xl border border-transparent hover:border-red-100 transition-all">
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                                <p className="font-black text-gray-800 text-sm leading-tight mb-1">{item.display_name}</p>
                                <p className="text-[10px] text-gray-500 line-clamp-2">{item.selection_summary}</p>
                                <p className="text-red-600 font-black text-sm mt-2">${(parseFloat(item.item_total) || 0).toLocaleString()}</p>
                            </div>
                            <button 
                                onClick={() => onRemoveItem(item.id)}
                                className="bg-red-100 text-red-600 p-2 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                title="Eliminar ítem"
                            >
                                🗑️
                            </button>
                        </div>
                        </div>
                    ))
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

          {/* FORMULARIO DE PAGO (DERECHA) */}
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

                {formData.delivery_type === 'domicilio' && (
                    <div className="animate-in slide-in-from-top duration-300 space-y-4">
                    <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-start gap-3">
                        <span className="text-xl">ℹ️</span>
                        <div>
                            <p className="text-xs font-black text-blue-700 uppercase">Nota sobre el envío</p>
                            <p className="text-[11px] text-blue-600 font-bold">El servicio a domicilio tiene un costo adicional de <span className="font-black text-blue-800">${dbSettings.costo_domicilio.toLocaleString()}</span> que ya se sumó a tu total.</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Dirección de entrega</label>
                        <input
                            type="text"
                            name="customer_address"
                            value={formData.customer_address}
                            onChange={handleChange}
                            required
                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-600 outline-none transition-all font-bold"
                            placeholder="Ej: Calle 123 # 45-67 Barrio ..."
                        />
                    </div>
                    </div>
                )}

                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading || cartItems.length === 0}
                        className="flex-1 py-5 bg-red-600 text-white rounded-3xl font-black text-lg shadow-xl hover:bg-red-700 active:scale-95 transition-all disabled:bg-gray-200"
                    >
                        {loading ? 'ENVIANDO PEDIDO...' : '🔥 CONFIRMAR PEDIDO'}
                    </button>
                </div>
                </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fee2e2; border-radius: 10px; }
      `}</style>
    </div>
  );
}
