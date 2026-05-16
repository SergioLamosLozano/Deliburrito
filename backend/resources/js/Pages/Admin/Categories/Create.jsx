import React from 'react';
import Layout from '../Layout';
import { useForm } from '@inertiajs/react';

// Etiquetas legibles para cada product_target
const TARGET_LABELS = {
  tortihamburguesa: 'Tortihamburguesa',
  burrito: 'Burrito',
};

export default function Create({ variations = {} }) {
  const { data, setData, post, errors } = useForm({
    name: '',
    product_type: 'ambos',
    is_required: false,
    max_selections: 1,
    order_index: 8,
    variation_ids: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/admin/categories');
  };

  const toggleVariation = (id) => {
    const current = data.variation_ids;
    setData(
      'variation_ids',
      current.includes(id) ? current.filter(v => v !== id) : [...current, id]
    );
  };

  // Solo mostrar variaciones del product_target relevante
  // 'ambos' → mostrar todas; 'burrito' / 'tortihamburguesa' → solo las de ese target
  const relevantTargets = Object.keys(variations).filter(target =>
    data.product_type === 'ambos' || data.product_type === target
  );

  const hasVariations = relevantTargets.some(t => (variations[t] ?? []).length > 0);

  return (
    <Layout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-red-600 mb-6">Nueva Categoría</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">

          {/* Tipo de Producto */}
          <div>
            <label className="block text-sm font-semibold mb-2">Tipo de Producto *</label>
            <select
              value={data.product_type}
              onChange={(e) => {
                setData('product_type', e.target.value);
                // Limpiar variaciones al cambiar el tipo para evitar IDs inválidos
                setData('variation_ids', []);
              }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
              required
            >
              <option value="ambos">Aparece en Ambos</option>
              <option value="burrito">Solo Burrito</option>
              <option value="tortihamburguesa">Solo Tortihamburguesa</option>
            </select>
            {errors.product_type && <p className="text-red-600 text-sm mt-1">{errors.product_type}</p>}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold mb-2">Nombre de la Categoría *</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-600"
              placeholder="ej: Proteína Extra"
              required
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Orden y Max Selecciones */}
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

          {/* Es requerida */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.is_required}
              onChange={(e) => setData('is_required', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className="font-semibold">Esta categoría es requerida</span>
          </label>

          {/* ── Variaciones de Producto ──────────────────────────────── */}
          <div className="border border-dashed border-gray-300 rounded-lg p-4">
            <p className="text-sm font-bold text-gray-700 mb-1">
              Habilitar solo para estas variaciones{' '}
              <span className="text-gray-400 font-normal">(Opcional)</span>
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Si no marcas ninguna, la categoría aparece para <strong>todos</strong> los pedidos
              del tipo de producto seleccionado. Si marcas algunas, solo aparece cuando el cliente
              elige esa variación.
            </p>

            {!hasVariations ? (
              <p className="text-xs text-gray-400 italic">
                No hay variaciones configuradas para este tipo de producto. Créalas primero.
              </p>
            ) : (
              relevantTargets.map(target => (
                <div key={target} className="mb-4">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                    {TARGET_LABELS[target] ?? target}
                  </p>
                  <div className="space-y-2 pl-2">
                    {(variations[target] ?? []).map(v => (
                      <label key={v.id} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={data.variation_ids.includes(v.id)}
                          onChange={() => toggleVariation(v.id)}
                          className="w-4 h-4 rounded border-gray-300 accent-red-600"
                        />
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-red-600 transition-colors">
                          {v.name}
                          {v.price > 0 && (
                            <span className="ml-2 text-xs text-gray-400 font-normal">
                              ${parseInt(v.price).toLocaleString()}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}

            {data.variation_ids.length > 0 && (
              <p className="mt-2 text-xs text-blue-600 font-semibold">
                ✓ Habilitada para {data.variation_ids.length} variación(es)
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              ✓ Crear Categoría
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
