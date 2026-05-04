import React from 'react';
import Layout from '../Layout';
import { useForm } from '@inertiajs/react';

export default function Edit({ category }) {
  const { data, setData, put, errors } = useForm({
    name: category.name || '',
    product_type: category.product_type || 'ambos',
    is_required: category.is_required || false,
    max_selections: category.max_selections || 1,
    order_index: category.order_index || 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(`/admin/categories/${category.id}`);
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-red-600 mb-6">Editar: {category.name}</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Tipo de Producto *</label>
            <select
              value={data.product_type}
              onChange={(e) => setData('product_type', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
              required
            >
              <option value="ambos">Aparece en Ambos</option>
              <option value="burrito">Solo Burrito</option>
              <option value="tortihamburguesa">Solo Tortihamburguesa</option>
            </select>
            {errors.product_type && <p className="text-red-600 text-sm mt-1">{errors.product_type}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Nombre de la Categoría *</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
              required
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Orden de Visualización</label>
              <input
                type="number"
                value={data.order_index}
                onChange={(e) => setData('order_index', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Máx Selecciones</label>
              <input
                type="number"
                value={data.max_selections}
                onChange={(e) => setData('max_selections', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
                min="1"
              />
            </div>
          </div>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.is_required}
              onChange={(e) => setData('is_required', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className="font-semibold">Esta categoría es requerida</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              ✓ Guardar Cambios
            </button>
            <a
              href="/admin/categories"
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
