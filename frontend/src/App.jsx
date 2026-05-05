import React, { useState } from 'react';
import BurritoBuilder from './components/BurritoBuilder';
import Checkout from './components/Checkout';
import OrderSuccess from './components/OrderSuccess';

export default function App(){
  const [view, setView] = useState('builder'); // 'builder', 'checkout', 'success'
  const [cart, setCart] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // MEDIA-04: inicializar la cookie CSRF de Laravel al montar la app
  React.useEffect(() => {
    fetch('/sanctum/csrf-cookie', { credentials: 'include' });
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
          showToast={showToast}
        />
      )}
      {view === 'success' && <OrderSuccess orderId={orderId} onReset={handleReset} />}

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
    </>
  );
}
