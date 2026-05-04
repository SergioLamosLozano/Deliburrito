import React from 'react';
import Layout from '../Layout';
import { Link } from '@inertiajs/react';

export default function Index({ categories }) {
  const handleToggle = async (categoryId) => {
    try {
      const response = await fetch(`/admin/categories/toggle/${categoryId}`, {
        method: 'GET',
        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
      });
      window.location.reload();
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    
    try {
      const response = await fetch(`/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
      });
      window.location.reload();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-600">Categorías del Menú</h1>
          <Link
            href="/admin/categories/create"
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
          >
            ➕ Nueva Categoría
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-red-600">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-500">Categoría #{cat.order_index}</p>
                  <h3 className="text-lg font-bold">{cat.name}</h3>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  cat.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {cat.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="mb-4 pb-4 border-b">
                <p className="text-sm">
                  <span className="font-semibold">Producto:</span> <span className="capitalize">{cat.product_type}</span>
                </p>

                <p className="text-sm">
                  <span className="font-semibold">Requerida:</span> {cat.is_required ? 'Sí' : 'No'}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Max selecciones:</span> {cat.max_selections}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Opciones:</span> {cat.options_count || 0}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/categories/${cat.id}/edit`}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 text-center text-sm"
                >
                  ✎ Editar
                </Link>
                <button
                  onClick={() => handleToggle(cat.id)}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                    cat.is_active
                      ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {cat.is_active ? '⊘ Desactivar' : '✓ Activar'}
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
