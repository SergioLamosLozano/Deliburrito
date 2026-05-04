import React from 'react';

export default function OrderSuccess({ orderId, onReset }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">¡Pedido Enviado!</h1>
        <p className="text-gray-600 mb-4">Tu pedido fue recibido correctamente</p>
        
        <div className="bg-gray-100 p-4 rounded mb-6">
          <p className="text-sm text-gray-600">Número de pedido</p>
          <p className="text-2xl font-bold text-gray-800">#{orderId}</p>
        </div>

        <p className="text-gray-600 mb-6">
          Te contactaremos al número que proporcionaste para confirmar tu pedido. 
          Puedes seguir el estado en tu correo electrónico.
        </p>

        <button
          onClick={onReset}
          className="w-full p-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600"
        >
          Hacer otro pedido
        </button>
      </div>
    </div>
  );
}
