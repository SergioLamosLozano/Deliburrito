import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Layout({ children }) {
  const { auth } = usePage().props;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-red-700 text-white flex flex-col">
        <div className="p-6 border-b border-red-600">
          <h1 className="text-2xl font-bold">Deli<span className="text-yellow-300">Burrito</span></h1>
          <p className="text-sm text-red-100 mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin/orders"
            className="block px-4 py-3 rounded-lg hover:bg-red-600 transition-all font-semibold"
          >
            📦 Pedidos
          </Link>
          <Link
            href="/admin/categories"
            className="block px-4 py-3 rounded-lg hover:bg-red-600 transition-all font-semibold"
          >
            📂 Categorías
          </Link>
          <Link
            href="/admin/product-variations"
            className="block px-4 py-3 rounded-lg hover:bg-red-600 transition-all font-semibold"
          >
            🎛️ Tipos de Producto
          </Link>
          <Link
            href="/admin/options"
            className="block px-4 py-3 rounded-lg hover:bg-red-600 transition-all font-semibold"
          >
            🍖 Opciones
          </Link>
          <Link
            href="/admin/reports"
            className="block px-4 py-3 rounded-lg hover:bg-red-600 transition-all font-semibold"
          >
            📊 Reportes
          </Link>
          <Link
            href="/admin/settings"
            className="block px-4 py-3 rounded-lg hover:bg-red-600 transition-all font-semibold"
          >
            ⚙️ Configuración
          </Link>
        </nav>

        <div className="p-4 border-t border-red-600">
          <p className="text-sm text-red-100 mb-3">Sesión: {auth.user.name}</p>
          <form action="/admin/logout" method="POST" className="w-full">
            <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-semibold transition-all"
            >
              Salir
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Administración</h2>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>
        <main className="bg-gray-100 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
