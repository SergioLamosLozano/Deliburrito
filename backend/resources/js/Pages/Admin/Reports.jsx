import React, { useState } from 'react';
import Layout from '../Layout';

export default function Reports({ orders, categories, totalRevenue, totalOrders, avgOrderValue }) {
  const [dateRange, setDateRange] = useState('today');

  const getDateLabel = () => {
    const today = new Date();
    switch(dateRange) {
      case 'today': return today.toLocaleDateString('es-CO');
      case 'week': return `Última semana`;
      case 'month': return `Último mes`;
      default: return 'Período';
    }
  };

  const statusCounts = {
    pendiente: orders.filter(o => o.status === 'pendiente').length,
    aceptado: orders.filter(o => o.status === 'aceptado').length,
    cancelado: orders.filter(o => o.status === 'cancelado').length,
  };

  const deliveryTypeCounts = {
    domicilio: orders.filter(o => o.delivery_type === 'domicilio').length,
    local: orders.filter(o => o.delivery_type === 'local').length,
    recoger: orders.filter(o => o.delivery_type === 'recoger').length,
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-600">Reportes y Análisis</h1>
          <div className="flex gap-2">
            {['today', 'week', 'month'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  dateRange === range
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                {range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-600">
            <p className="text-gray-600 text-sm">Ingresos Totales</p>
            <p className="text-3xl font-bold text-red-600">${totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{getDateLabel()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400">
            <p className="text-gray-600 text-sm">Total Pedidos</p>
            <p className="text-3xl font-bold text-yellow-600">{totalOrders}</p>
            <p className="text-xs text-gray-500 mt-1">{getDateLabel()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
            <p className="text-gray-600 text-sm">Valor Promedio</p>
            <p className="text-3xl font-bold text-green-600">${avgOrderValue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Por pedido</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
            <p className="text-gray-600 text-sm">Categorías Activas</p>
            <p className="text-3xl font-bold text-blue-600">{categories.filter(c => c.is_active).length}</p>
            <p className="text-xs text-gray-500 mt-1">{categories.length} total</p>
          </div>
        </div>

        {/* Status & Delivery Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Estado de Pedidos</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">Pendientes</span>
                  <span className="text-sm">{statusCounts.pendiente}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${(statusCounts.pendiente / totalOrders) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">Aceptados</span>
                  <span className="text-sm">{statusCounts.aceptado}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(statusCounts.aceptado / totalOrders) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">Cancelados</span>
                  <span className="text-sm">{statusCounts.cancelado}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${(statusCounts.cancelado / totalOrders) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Tipo de Entrega</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">🚗 Domicilio</span>
                  <span className="text-sm">{deliveryTypeCounts.domicilio}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(deliveryTypeCounts.domicilio / totalOrders) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">🏪 Para Comer</span>
                  <span className="text-sm">{deliveryTypeCounts.local}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(deliveryTypeCounts.local / totalOrders) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">📦 Para Recoger</span>
                  <span className="text-sm">{deliveryTypeCounts.recoger}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${(deliveryTypeCounts.recoger / totalOrders) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Últimos Pedidos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Hora</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold">#{order.id}</td>
                    <td className="px-4 py-2">{order.customer_name}</td>
                    <td className="px-4 py-2">
                      {order.delivery_type === 'domicilio' ? '🚗' : order.delivery_type === 'local' ? '🏪' : '📦'}
                    </td>
                    <td className="px-4 py-2 text-right font-bold">${order.total.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'aceptado' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
