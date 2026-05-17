import React, { useState } from 'react';
import BurritoBuilder from './components/BurritoBuilder';
import Checkout from './components/Checkout';
import OrderSuccess from './components/OrderSuccess';

export default function App(){
  const [view, setView] = useState('builder'); // 'builder', 'checkout', 'success'
  const [cart, setCart] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [itemToDuplicate, setItemToDuplicate] = useState(null);
  const [storeOpen, setStoreOpen] = useState(true); // Estado del comercio

  // MEDIA-04: inicializar la cookie CSRF de Laravel al montar la app
  React.useEffect(() => {
    fetch('/sanctum/csrf-cookie', { credentials: 'include' });
  }, []);

  // Cargar categorías para saber cuáles son adicionales
  React.useEffect(() => {
    fetch('/menu')
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  const checkStoreStatus = () => {
    fetch('/public-config')
      .then(r => r.json())
      .then(settings => {
        const openSetting = settings.find(s => s.key === 'comercio_abierto');
        setStoreOpen(openSetting ? openSetting.value === '1' : true);
      })
      .catch(() => setStoreOpen(true)); // Por defecto abierto si hay error
  };

  // Verificar si el comercio está abierto
  React.useEffect(() => {
    // Verificar al cargar
    checkStoreStatus();

    // Verificar cada 30 segundos
    const interval = setInterval(checkStoreStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleCheckout = (items) => {
    setCart(items);
    setView('checkout');
  };

  const handleRemoveItem = (id) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    if (newCart.length === 0) {
      setView('builder');
      showToast('Tu carrito quedó vacío', 'error');
    }
  };

  const handleDuplicateItem = (id) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    // Si categories no está cargado, recargar
    if (categories.length === 0) {
      fetch('/menu')
        .then(r => r.json())
        .then(data => {
          setCategories(data);
          // Reintentar después de cargar
          setTimeout(() => handleDuplicateItem(id), 100);
        });
      return;
    }
    
    // Verificar si el ítem tiene opciones de categorías adicionales
    console.log('🔍 Verificando adicionales para item:', item);
    console.log('📦 Categories disponibles:', categories.length);
    console.log('🎯 Item options:', item.options);
    
    const hasAddons = item.options.some(opt => {
      const option = categories
        .flatMap(cat => cat.options || [])
        .find(o => o.id === opt.option_id);
      
      console.log(`🔎 Buscando option_id: ${opt.option_id}`, option);
      
      if (!option) return false;
      
      // CORRECCIÓN: Convertir ambos a número para comparar
      const category = categories.find(cat => Number(cat.id) === Number(option.category_id));
      
      console.log(`📁 Category para option ${opt.option_id}:`, category);
      console.log(`✅ is_addon:`, category?.is_addon, 'tipo:', typeof category?.is_addon);
      
      return category && (category.is_addon === true || category.is_addon === 1 || category.is_addon === '1');
    });
    
    console.log('🎪 ¿Tiene adicionales?', hasAddons);

    if (hasAddons) {
      // Mostrar modal de confirmación
      setItemToDuplicate(item);
      setShowDuplicateModal(true);
    } else {
      // Duplicar directamente si no hay adicionales
      setCart(prev => [...prev, { ...item, id: Date.now() }]);
      showToast('Producto duplicado', 'success');
    }
  };

  const duplicateWithAddons = (includeAddons) => {
    if (!itemToDuplicate) return;
    
    let newItem = { ...itemToDuplicate, id: Date.now() };
    
    if (!includeAddons) {
      // Filtrar opciones que NO sean de categorías adicionales
      const filteredOptions = itemToDuplicate.options.filter(opt => {
        const option = categories
          .flatMap(cat => cat.options || [])
          .find(o => o.id === opt.option_id);
        if (!option) return true; // Mantener si no encontramos la opción
        
        // CORRECCIÓN: Convertir ambos a número para comparar
        const category = categories.find(cat => Number(cat.id) === Number(option.category_id));
        return !category || (category.is_addon !== true && category.is_addon !== 1 && category.is_addon !== '1');
      });
      
      newItem.options = filteredOptions;
      
      // Recalcular el total sin los adicionales
      const basePrice = itemToDuplicate.item_total || 0;
      const addonsPrice = itemToDuplicate.options
        .filter(opt => !filteredOptions.find(f => f.option_id === opt.option_id))
        .reduce((sum, opt) => {
          const option = categories
            .flatMap(cat => cat.options || [])
            .find(o => o.id === opt.option_id);
          return sum + (parseFloat(option?.price || 0) * (opt.quantity || 1));
        }, 0);
      
      newItem.item_total = basePrice - addonsPrice;
      
      // Actualizar el resumen de selección
      newItem.selection_summary = filteredOptions
        .map(o => categories.flatMap(c => c.options ?? []).find(op => op.id === o.option_id)?.name ?? '')
        .filter(Boolean).join(', ');
    }
    
    setCart(prev => [...prev, newItem]);
    setShowDuplicateModal(false);
    setItemToDuplicate(null);
    showToast(includeAddons ? 'Producto duplicado con adicionales' : 'Producto duplicado sin adicionales', 'success');
  };

  const handleSuccess = (id) => {
    setOrderId(id);
    setView('success');
  };

  const handleReset = () => {
    setCart([]);
    setOrderId(null);
    setView('builder');
  };

  return (
    <>
      {view === 'builder' && <BurritoBuilder onCheckout={handleCheckout} initialCart={cart} showToast={showToast} />}
      {view === 'checkout' && (
        <Checkout 
          cartItems={cart} 
          onBack={() => setView('builder')} 
          onSuccess={handleSuccess} 
          onRemoveItem={handleRemoveItem}
          onDuplicateItem={handleDuplicateItem}
          showToast={showToast}
        />
      )}
      {view === 'success' && <OrderSuccess orderId={orderId} onReset={handleReset} />}

      {/* Modal de confirmación para duplicar */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border-4 border-yellow-400 animate-in zoom-in duration-300">
            <div className="text-center mb-6">
              <span className="text-5xl mb-4 block">🍔</span>
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-2">
                ¿Duplicar con adicionales?
              </h2>
              <p className="text-sm text-gray-500 font-bold">
                Este producto tiene ingredientes adicionales. ¿Deseas incluirlos en la copia?
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => duplicateWithAddons(true)}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 active:scale-95 transition-all"
              >
                ✅ SÍ, CON ADICIONALES
              </button>
              <button
                onClick={() => duplicateWithAddons(false)}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-orange-700 active:scale-95 transition-all"
              >
                🚫 NO, SIN ADICIONALES
              </button>
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setItemToDuplicate(null);
                }}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 active:scale-95 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Toast UI */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`
            pointer-events-auto min-w-[300px] flex items-center gap-4 p-4 rounded-2xl shadow-2xl border bg-white
            animate-in slide-in-from-right duration-500 transform transition-all
            ${t.type === 'success' ? 'border-green-100 text-green-800' : 'border-red-100 text-red-800'}
          `}>
            <span className="text-2xl">{t.type === 'success' ? '✅' : '❌'}</span>
            <div>
              <p className="font-black uppercase text-[10px] tracking-widest opacity-50">{t.type === 'success' ? 'Éxito' : 'Atención'}</p>
              <p className="font-bold text-sm leading-tight">{t.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Comercio Cerrado */}
      {!storeOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-8 sm:p-12 max-w-full sm:max-w-lg w-full shadow-2xl border-4 border-red-600 text-center animate-in zoom-in duration-500 max-h-[90vh] overflow-y-auto">
            <div className="mb-8">
              <span className="text-7xl sm:text-8xl mb-6 block animate-pulse">🔒</span>
              <h2 className="text-3xl sm:text-4xl font-black text-red-600 uppercase tracking-tighter mb-4">
                ¡Lo sentimos!
              </h2>
              <p className="text-lg sm:text-xl font-bold text-gray-700 leading-relaxed">
                El comercio aún no ha abierto
              </p>
              <p className="text-sm text-gray-500 font-bold mt-4">
                Por favor, vuelve más tarde para realizar tu pedido
              </p>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
