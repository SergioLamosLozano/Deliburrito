import React, { useState } from 'react';
import Layout from '../Layout';
import { Link } from '@inertiajs/react';

export default function OrdersIndex({ orders }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('pendiente');

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  const handleAccept = async (orderId) => {
    if (!window.confirm('¿Aceptar este pedido?')) return;
    
    try {
      const response = await fetch(`/admin/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
      });
      const data = await response.json();
      window.location.reload();
    } catch (err) {
      alert('Error al aceptar pedido');
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('¿Cancelar este pedido?')) return;
    
    try {
      const response = await fetch(`/admin/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
      });
      const data = await response.json();
      window.location.reload();
    } catch (err) {
      alert('Error al cancelar pedido');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-600">Cola de Pedidos</h1>
          <Link href="/admin/reports" className="bg-green-600 text-white px-4 py-2 rounded-lg">
            📊 Reportes
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-2">
          {['pendiente', 'aceptado', 'cancelado', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === status
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className={`bg-white p-4 rounded-lg shadow border-2 transition-all cursor-pointer ${
                order.status === 'pendiente'
                  ? 'border-yellow-400'
                  : order.status === 'aceptado'
                  ? 'border-green-400'
                  : 'border-red-400'
              }`}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="mb-3">
                <p className="text-sm text-gray-500">Pedido #{order.id}</p>
                <p className="text-lg font-bold">{order.customer_name}</p>
                <p className="text-sm text-gray-600">{order.customer_phone}</p>
              </div>

              <div className="mb-3 pb-3 border-b">
                <p className="text-sm font-semibold">{order.items.length} artículo(s)</p>
                {order.items.slice(0, 2).map(item => (
                  <p key={item.id} className="text-xs text-gray-600">
                    • {item.options.map(opt => opt.option.name).join(', ')}
                  </p>
                ))}
                {order.items.length > 2 && <p className="text-xs text-gray-500">+{order.items.length - 2} más</p>}
              </div>

              <div className="mb-4">
                <p className="text-2xl font-bold text-red-600">${order.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {order.delivery_type === 'domicilio' ? '🚗 Domicilio' : order.delivery_type === 'local' ? '🏪 Para comer' : '📦 Para recoger'}
                </p>
              </div>

              <div className="flex gap-2">
                {order.status === 'pendiente' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(order.id);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 text-sm"
                    >
                      ✓ Aceptar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(order.id);
                      }}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 text-sm"
                    >
                      ✕ Cancelar
                    </button>
                  </>
                )}
                {order.status === 'aceptado' && (
                  <a
                    href={`/admin/orders/${order.id}/print`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 text-center text-sm"
                  >
                    🖨️ Imprimir
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No hay pedidos en esta categoría</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-red-600">Pedido #{selectedOrder.id}</h2>
                  <p className="text-gray-600 text-sm mt-1">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 pb-4 border-b">
                <p className="font-semibold">Cliente</p>
                <p>{selectedOrder.customer_name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                {selectedOrder.customer_address && (
                  <p className="text-sm text-gray-600">📍 {selectedOrder.customer_address}</p>
                )}
              </div>

              <div className="mb-4 pb-4 border-b">
                <p className="font-semibold mb-2">Detalles del Pedido</p>
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="bg-gray-50 p-2 rounded mb-2 text-sm">
                    <p className="font-semibold">{item.options.map(opt => opt.option.name).join(', ')}</p>
                    <p className="text-gray-600">${item.item_total.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded mb-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>${selectedOrder.subtotal.toLocaleString()}</span>
                </div>
                {selectedOrder.delivery_cost > 0 && (
                  <div className="flex justify-between mb-2">
                    <span>Envío:</span>
                    <span>${selectedOrder.delivery_cost.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-red-600 border-t pt-2">
                  <span>Total:</span>
                  <span>${selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
