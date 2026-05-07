import React, { useState } from 'react';
import Layout from '../Layout';
import { useForm, router } from '@inertiajs/react';

const TARGET_LABELS = {
  tortihamburguesa: 'Tortihamburguesa',
  burrito: 'Burrito',
};

const TARGET_COLORS = {
  tortihamburguesa: 'bg-orange-100 text-orange-700',
  burrito: 'bg-green-100 text-green-700',
};

// ── Modal de Crear / Editar ───────────────────────────────────────────────
function VariationModal({ variation, onClose }) {
  const isEditing = !!variation;

  const { data, setData, post, put, errors, processing, reset } = useForm({
    product_target: variation?.product_target ?? 'tortihamburguesa',
    name:           variation?.name           ?? '',
    base_price:     variation?.base_price      ?? '',
    is_active:      variation?.is_active       ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      put(`/admin/product-variations/${variation.id}`, {
        onSuccess: onClose,
      });
    } else {
      post('/admin/product-variations', {
        onSuccess: () => { reset(); onClose(); },
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Editar Variación' : 'Nueva Variación'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Producto destino */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Producto al que pertenece *
            </label>
            <select
              value={data.product_target}
              onChange={(e) => setData('product_target', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-gray-50 font-semibold"
              required
            >
              <option value="tortihamburguesa">🍔 Tortihamburguesa</option>
              <option value="burrito">🌯 Burrito</option>
            </select>
            {errors.product_target && (
              <p className="text-red-600 text-xs mt-1">{errors.product_target}</p>
            )}
          </div>

          {/* Nombre del tipo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del Tipo *
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="ej: Sencilla, Mixta, Doble..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-gray-50 font-semibold"
              required
            />
            {errors.name && (
              <p className="text-red-600 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Precio base */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Precio Base *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input
                type="number"
                value={data.base_price}
                onChange={(e) => setData('base_price', e.target.value)}
                placeholder="0"
                min="0"
                step="100"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-gray-50 font-semibold"
                required
              />
            </div>
            {errors.base_price && (
              <p className="text-red-600 text-xs mt-1">{errors.base_price}</p>
            )}
          </div>

          {/* Activo */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setData('is_active', !data.is_active)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                data.is_active ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  data.is_active ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {data.is_active ? 'Activa' : 'Inactiva'}
            </span>
          </label>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-[2] py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg disabled:opacity-60"
            >
              {processing
                ? 'Guardando...'
                : isEditing
                ? '✓ Guardar Cambios'
                : '✓ Crear Variación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Vista principal ───────────────────────────────────────────────────────
export default function ProductVariationsIndex({ variations = [], flash = {} }) {
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingVar, setEditingVar]     = useState(null);

  const openCreate = () => { setEditingVar(null); setModalOpen(true); };
  const openEdit   = (v)  => { setEditingVar(v);   setModalOpen(true); };
  const closeModal = ()   => { setModalOpen(false); setEditingVar(null); };

  const handleToggle = (id) => {
    router.get(
      `/admin/product-variations/toggle/${id}`,
      {},
      { preserveScroll: true }
    );
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Eliminar esta variación? Las categorías que la usen perderán esa condición.')) return;
    router.delete(`/admin/product-variations/${id}`, { preserveScroll: true });
  };

  // Agrupar por product_target para la tabla
  const grouped = variations.reduce((acc, v) => {
    if (!acc[v.product_target]) acc[v.product_target] = [];
    acc[v.product_target].push(v);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-red-600">Tipos de Producto</h1>
            <p className="text-gray-500 text-sm mt-1">
              Variaciones con precio base propio (ej. Sencilla, Mixta, Doble)
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-sm"
          >
            ➕ Nueva Variación
          </button>
        </div>

        {/* Flash */}
        {flash?.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl font-semibold text-sm">
            ✓ {flash.success}
          </div>
        )}

        {/* Tabla agrupada */}
        {variations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-16 text-center">
            <p className="text-5xl mb-4">🎛️</p>
            <p className="text-gray-500 font-semibold">No hay variaciones configuradas aún.</p>
            <p className="text-gray-400 text-sm mt-1">
              Crea las variaciones de tus productos para habilitar categorías condicionales.
            </p>
            <button
              onClick={openCreate}
              className="mt-6 bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Crear primera variación
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([target, items]) => (
              <div key={target} className="bg-white rounded-2xl shadow overflow-hidden">
                {/* Cabecera del grupo */}
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-3">
                  <span className="text-xl">{target === 'tortihamburguesa' ? '🍔' : '🌯'}</span>
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-600">
                    {TARGET_LABELS[target] ?? target}
                  </h2>
                  <span className="ml-auto text-xs text-gray-400 font-semibold">
                    {items.length} variación{items.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                <table className="w-full text-left">
                  <thead className="text-xs font-black uppercase text-gray-400 tracking-widest bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3">Nombre</th>
                      <th className="px-6 py-3">Precio Base</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-800">{v.name}</td>
                        <td className="px-6 py-4 font-black text-red-600">
                          ${parseInt(v.base_price).toLocaleString('es-CO')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                            v.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {v.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEdit(v)}
                              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                            >
                              ✎ Editar
                            </button>
                            <button
                              onClick={() => handleToggle(v.id)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                v.is_active
                                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {v.is_active ? '⊘ Desactivar' : '✓ Activar'}
                            </button>
                            <button
                              onClick={() => handleDelete(v.id)}
                              className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition-all"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <VariationModal
          variation={editingVar}
          onClose={closeModal}
        />
      )}
    </Layout>
  );
}
