import React from 'react';
import { IoPeople } from 'react-icons/io5';

/**
 * Badge elegante y responsivo para mostrar la mesa activa y el rol del comensal.
 * Formato requerido: "Mesa X - Rol: Anfitrión/Invitado"
 */
export default function TableBadge({ session }) {
  if (!session || !session.table_id) return null;

  const isHost = session.role === 'host';
  const roleText = isHost ? 'Anfitrión' : 'Invitado';
  const tableNum = session.table_number || session.table_id;

  return (
    <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-lg border-2 text-xs sm:text-sm font-black transition-all ${
      isHost
        ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-amber-200/50'
        : 'bg-white text-gray-800 border-red-200 shadow-red-200/40'
    }`}>
      {/* Icono del rol */}
      <span className="flex items-center justify-center text-base">
        {isHost ? (
          <span title="Anfitrión de la Mesa">👑</span>
        ) : (
          <span className="p-1 rounded-full bg-red-100 text-red-600">
            <IoPeople className="w-4 h-4 text-red-600" />
          </span>
        )}
      </span>

      {/* Texto principal requerido */}
      <div className="flex items-center gap-2">
        <span className="tracking-tight text-gray-700">
          Mesa <span className="text-red-600 font-black">{tableNum}</span> - Rol:{' '}
          <span className={isHost ? 'text-amber-700 font-black' : 'text-red-600 font-black'}>
            {roleText}
          </span>
        </span>
        {session.guest_name && (
          <span className="opacity-90 font-bold text-[11px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full border border-gray-200">
            {session.guest_name}
          </span>
        )}
      </div>
    </div>
  );
}
