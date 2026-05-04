import React from 'react';
import Layout from '../Layout';
import { Link } from '@inertiajs/react';

export default function OptionsIndex({ options }) {
  const handleToggle = async (optionId) => {
    try {
      await fetch(`/admin/options/toggle/${optionId}`, { method: 'GET', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content } });
      window.location.reload();
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const handleDelete = async (optionId) => {
    if (!window.confirm('¿Eliminar esta opción?')) return;
    try {
      await fetch(`/admin/options/${optionId}`, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content } });
      window.location.reload();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-600">Opciones del Menú</h1>
          <Link href="/admin/options/create" className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700">
            ➕ Nueva Opción
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.map(opt => (
            <div key={opt.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-500">Categoría: {opt.category.name}</p>
                  <h3 className="text-lg font-bold">{opt.name}</h3>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${opt.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {opt.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="mb-4 pb-4 border-b">
                <p className="text-sm"><span className="font-semibold">Precio Base:</span> ${opt.price_base.toLocaleString()}</p>
                <p className="text-sm"><span className="font-semibold">Precio Extra:</span> ${opt.price_extra.toLocaleString()}</p>
              </div>

              <div className="flex gap-2">
                <Link href={`/admin/options/${opt.id}/edit`} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 text-center text-sm">
                  ✎ Editar
                </Link>
                <button onClick={() => handleToggle(opt.id)} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${opt.is_active ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                  {opt.is_active ? '⊘' : '✓'}
                </button>
                <button onClick={() => handleDelete(opt.id)} className="bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 text-sm">
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
