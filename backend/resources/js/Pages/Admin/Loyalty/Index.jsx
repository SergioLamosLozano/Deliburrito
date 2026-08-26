import React, { useState } from 'react';
import Layout from '../Layout';
import { useForm } from '@inertiajs/react';

const DEFAULT_TEMPLATE = '¡Felicidades! Tienes un regalo por tus 15 pedidos.';

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.startsWith('57')) {
    return digits;
  }

  if (digits.length === 10) {
    return `57${digits}`;
  }

  return digits;
}

export default function Index({
  customers = [],
  loyaltyMessageTemplate = DEFAULT_TEMPLATE,
  loyaltyRequiredOrders = 15,
}) {
  const [savedMessage, setSavedMessage] = useState('');

  const { data, setData, put, processing, errors } = useForm({
    loyalty_message_template: loyaltyMessageTemplate || DEFAULT_TEMPLATE,
    loyalty_required_orders: loyaltyRequiredOrders || 15,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSavedMessage('');

    put(route('admin.loyalty.message.update'), {
      preserveScroll: true,
      onSuccess: () => setSavedMessage('Plantilla de fidelización guardada correctamente.'),
    });
  };

  const handleNotifyReward = (customer) => {
    const phone = normalizePhone(customer.customer_phone);

    if (!phone) {
      alert('Este cliente no tiene un teléfono válido para WhatsApp.');
      return;
    }

    const popup = window.open('', '_blank', 'noopener,noreferrer');

    fetch(route('admin.loyalty.notify', phone), {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
        Accept: 'application/json',
      },
    })
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || 'No se pudo notificar el premio');
        }

        if (popup) {
          popup.location.href = result.wa_link;
        } else {
          window.open(result.wa_link, '_blank', 'noopener,noreferrer');
        }

        window.location.reload();
      })
      .catch((error) => {
        if (popup) {
          popup.close();
        }

        alert(error.message || 'No se pudo notificar el premio');
      });
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-red-600">⭐ Fidelización / Top Clientes</h1>
          <p className="text-gray-600 mt-2">
            Identifica automáticamente a los clientes frecuentes y notifica sus premios por WhatsApp sin crear cuentas.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Plantilla de mensaje</h2>
              <p className="text-sm text-gray-500 mt-1">
                Se enviará a WhatsApp cuando el cliente alcance 15, 30, 45... pedidos aceptados.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              settings.loyalty_message_template
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Mensaje de premio
              </label>
              <textarea
                value={data.loyalty_message_template}
                onChange={(e) => setData('loyalty_message_template', e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder={DEFAULT_TEMPLATE}
              />
              {errors.loyalty_message_template && (
                <p className="mt-2 text-sm text-red-600">{errors.loyalty_message_template}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Pedidos requeridos para premio
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={data.loyalty_required_orders}
                onChange={(e) => setData('loyalty_required_orders', Number(e.target.value || 1))}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              {errors.loyalty_required_orders && (
                <p className="mt-2 text-sm text-red-600">{errors.loyalty_required_orders}</p>
              )}
            </div>

            {savedMessage && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {savedMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={processing}
                className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? 'Guardando...' : 'Guardar plantilla'}
              </button>
              <span className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-600">
                Guardado en la tabla `settings`
              </span>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Top Clientes</h2>
              <p className="text-sm text-gray-500 mt-1">
                Resaltamos en verde a quienes ya tienen un premio disponible.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {customers.length} cliente{customers.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Teléfono</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Total de Pedidos</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {customers.length > 0 ? (
                  customers.map((customer) => {
                    const hasReward = customer.reward_ready;

                    return (
                      <tr key={customer.customer_phone} className={hasReward ? 'bg-green-50/60' : ''}>
                        <td className="px-4 py-4 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{customer.customer_name}</span>
                            {hasReward && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">
                                🎁 Premio disponible
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-700">{customer.customer_phone}</td>
                        <td className="px-4 py-4 text-gray-700">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{customer.current_cycle_orders}</span>
                            <span className="text-xs text-gray-500">
                              Acumulado total: {customer.total_orders}
                            </span>
                            <span className="text-xs text-gray-500">
                              {customer.rewards_available} recompensa{customer.rewards_available === 1 ? '' : 's'} disponible{customer.rewards_available === 1 ? '' : 's'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {hasReward ? (
                            <button
                              type="button"
                              onClick={() => handleNotifyReward(customer)}
                              className="inline-flex items-center rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                              Notificar Premio
                            </button>
                          ) : (
                            <span className="inline-flex items-center rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-500">
                              Aún no aplica
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-10 text-center text-gray-500">
                      Todavía no hay clientes con pedidos aceptados para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}