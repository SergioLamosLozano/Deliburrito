import React from 'react';
import { useForm } from '@inertiajs/react';

export default function Login() {
  const { data, setData, post, errors } = useForm({
    email: '',
    password: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            Deli<span className="text-yellow-400">Burrito</span>
          </h1>
          <p className="text-gray-600 mt-2">Panel de Administración</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200"
              placeholder="admin@deliburrito.com"
              required
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Contraseña</label>
            <input
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200"
              placeholder="••••••••"
              required
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          {errors.general && <p className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">{errors.general}</p>}

          <button
            type="submit"
            className="w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition-all shadow-lg"
          >
            Acceder al Admin
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            <strong>Demo:</strong> admin@example.com / password
          </p>
        </div>
      </div>
    </div>
  );
}
