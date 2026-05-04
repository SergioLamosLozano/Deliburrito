import React from 'react';
import Layout from '../Layout';
import { useForm } from '@inertiajs/react';

export default function OptionsCreate({ categories }) {
  const { data, setData, post, errors } = useForm({
    category_id: categories[0]?.id || '',
    name: '',
    price_base: 0,
    price_extra: 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/admin/options');
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-red-600 mb-6">Nueva Opción</h1>

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
            {errors.category_id && <p className="text-red-600 text-sm mt-1">{errors.category_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Nombre de la Opción *</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
              placeholder="ej: Res"
              required
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Precio Base ($)</label>
              <input
                type="number"
                value={data.price_base}
                onChange={(e) => setData('price_base', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
                min="0"
                step="100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Precio Extra ($)</label>
              <input
                type="number"
                value={data.price_extra}
                onChange={(e) => setData('price_extra', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
                min="0"
                step="100"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              ✓ Crear Opción
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
