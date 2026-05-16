import React from 'react';
import Layout from '../Layout';
import { useForm } from '@inertiajs/react';

export default function OptionsEdit({ option, categories }) {
  const { data, setData, put, errors } = useForm({
    category_id: option.category_id || '',
    name: option.name || '',
    price: option.price || 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(`/admin/options/${option.id}`);
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-red-600 mb-6">Editar: {option.name}</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Categoría *</label>
            <select
              value={data.category_id}
              onChange={(e) => setData('category_id', parseInt(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
              required
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Nombre de la Opción *</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Precio ($)</label>
            <input
              type="number"
              value={data.price}
              onChange={(e) => setData('price', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
              min="0"
              step="100"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              ✓ Guardar Cambios
            </button>
            <a
              href="/admin/options"
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
