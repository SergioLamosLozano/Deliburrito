import React from 'react';
import Layout from './Layout';
import { useForm } from '@inertiajs/react';

export default function Settings({ settings }) {
  const { data, setData, put, errors } = useForm({
    costo_domicilio: settings?.costo_domicilio || 5000,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put('/admin/settings');
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-red-600 mb-6">⚙️ Configuración General</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Costo de Domicilio ($)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={data.costo_domicilio}
                onChange={(e) => setData('costo_domicilio', parseInt(e.target.value) || 0)}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
                min="0"
                step="100"
              />
              <span className="text-gray-600 font-semibold">COP</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Se suma al total cuando el cliente selecciona "Domicilio"</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
            <p className="text-sm text-blue-900">
              <strong>💡 Nota:</strong> Este valor se aplica a todos los pedidos nuevos con entrega a domicilio.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              ✓ Guardar Cambios
            </button>
            <a
              href="/admin/orders"
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 text-center"
            >
              ✕ Cancelar
            </a>
          </div>
        </form>
      </div>
    </Layout>
  );
}
