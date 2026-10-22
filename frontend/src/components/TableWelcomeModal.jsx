import React, { useState, useEffect } from 'react';
import { 
  IoRestaurant, 
  IoPerson, 
  IoAlertCircle, 
  IoArrowForward, 
  IoLockClosed, 
  IoPeople, 
  IoSparkles, 
  IoArrowBack 
} from 'react-icons/io5';

/**
 * Modal Bloqueante de Bienvenida a la Mesa al escanear QR (?mesa=HASH).
 * Maneja el flujo de entrada normal, advertencia de mesa ocupada con anfitrión previo
 * ("¿Vienes en su grupo?"), y toma de control (Override) para mesas abandonadas.
 */
export default function TableWelcomeModal({ 
  isOpen, 
  isJoining, 
  error, 
  currentHostName, 
  onJoin, 
  onOverride 
}) {
  const [name, setName] = useState('');
  // step: 'ask_group' (Paso 1 advertencia), 'join_guest' (Paso 2 unirse), 'override_host' (Paso tomar control), 'direct_join' (mesa libre)
  const [step, setStep] = useState('direct_join');

  // Sincronizar paso inicial según si detectamos que la mesa ya tiene anfitrión
  useEffect(() => {
    if (currentHostName) {
      setStep('ask_group');
    } else {
      setStep('direct_join');
    }
  }, [currentHostName, isOpen]);

  if (!isOpen) return null;

  const isOrderLocked = error && error.toLowerCase().includes('pedido');

  // Manejo de envío según el paso activo
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || isJoining) return;
    const isConfirmingGuest = step === 'join_guest' || Boolean(currentHostName);
    onJoin(name.trim(), isConfirmingGuest);
  };

  const handleOverrideSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || isJoining) return;
    onOverride(name.trim());
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-9 max-w-md w-full shadow-2xl border-4 border-yellow-400 relative overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Decoraciones de fondo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-yellow-100 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-red-100 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 text-center">

          {/* Alerta de Error de servidor (ej. 403 Pedido en curso o 404) */}
          {error && (
            <div className={`mb-5 p-4 rounded-2xl text-left border flex items-start gap-3 animate-in shake duration-200 ${
              isOrderLocked 
                ? 'bg-amber-50 border-amber-300 text-amber-900' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {isOrderLocked ? (
                <IoLockClosed className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <IoAlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs sm:text-sm">
                <p className="font-black uppercase tracking-wider text-[10px] mb-0.5">
                  {isOrderLocked ? 'Mesa en Curso' : 'Aviso'}
                </p>
                <p className="font-semibold leading-snug">{error}</p>
                {isOrderLocked && (
                  <p className="text-[11px] text-amber-700/80 mt-1">
                    Por favor solicita al personal o anfitrión que liberen la mesa si necesitan hacer un nuevo pedido.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              CASO 1: PASO 1 CONDICIONAL (Mesa ocupada por currentHostName)
             ══════════════════════════════════════════════════════════════════ */}
          {step === 'ask_group' && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-xl shadow-amber-500/30 mb-4 transform -rotate-2">
                <IoPeople className="w-10 h-10" />
              </div>

              <div className="inline-block bg-amber-100 text-amber-900 text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-3">
                📍 Mesa con Sesión Activa
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">
                ¡Mesa en Uso!
              </h2>

              <p className="text-base sm:text-lg font-bold text-gray-800 mb-2 leading-snug">
                Esta mesa está a cargo de <span className="text-red-600 font-black">"{currentHostName}"</span>.
              </p>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-6">
                ¿Vienes en su grupo o la mesa estaba desocupada?
              </p>

              {/* Botones de Decisión */}
              <div className="space-y-3">
                {/* Botón A: Sí, unirme al grupo */}
                <button
                  type="button"
                  onClick={() => setStep('join_guest')}
                  className="w-full py-4 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-between shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3 text-left">
                    <IoPeople className="w-6 h-6 shrink-0" />
                    <div>
                      <span className="block leading-none">Sí, unirme al grupo</span>
                      <span className="text-[10px] font-semibold opacity-90 lowercase first-letter:uppercase">
                        Compartir carrito con {currentHostName}
                      </span>
                    </div>
                  </div>
                  <IoArrowForward className="w-5 h-5 shrink-0" />
                </button>

                {/* Botón B: No, la mesa está vacía (Override) */}
                <button
                  type="button"
                  onClick={() => setStep('override_host')}
                  className="w-full py-3.5 px-5 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 border-2 border-gray-200 hover:border-red-300 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-between active:scale-[0.98] transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3 text-left">
                    <IoSparkles className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="block leading-none">No, la mesa está vacía</span>
                      <span className="text-[10px] font-semibold text-gray-400 lowercase first-letter:uppercase">
                        Limpiar mesa y ser nuevo Anfitrión
                      </span>
                    </div>
                  </div>
                  <IoArrowForward className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              CASO 2: PASO 2 - UNIRSE COMO INVITADO AL GRUPO
             ══════════════════════════════════════════════════════════════════ */}
          {step === 'join_guest' && (
            <div className="animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => setStep('ask_group')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 mb-4 transition-colors"
              >
                <IoArrowBack className="w-4 h-4" />
                Volver a opciones
              </button>

              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 mb-3">
                <IoPeople className="w-8 h-8" />
              </div>

              <div className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full mb-2">
                👥 Invitado de {currentHostName}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">
                ¿Cuál es tu nombre?
              </h2>
              <p className="text-xs text-gray-400 font-medium mb-5">
                Escribe cómo quieres aparecer en el carrito grupal de esta mesa.
              </p>

              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div className="relative text-left">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <IoPerson className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      required
                      maxLength={40}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Sofía, Carlos, Mateo..."
                      disabled={isJoining}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-2xl font-bold text-gray-800 placeholder-gray-400 text-base focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!name.trim() || isJoining}
                  className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] ${
                    !name.trim() || isJoining
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/30'
                  }`}
                >
                  {isJoining ? 'Uniendo al grupo...' : 'Unirme a la Mesa'}
                  <IoArrowForward className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              CASO 3: PASO OVERRIDE - TOMAR EL CONTROL DE MESA ABANDONADA
             ══════════════════════════════════════════════════════════════════ */}
          {step === 'override_host' && (
            <div className="animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => setStep('ask_group')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 mb-4 transition-colors"
              >
                <IoArrowBack className="w-4 h-4" />
                Volver a opciones
              </button>

              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 mb-3">
                <IoSparkles className="w-8 h-8" />
              </div>

              <div className="inline-block bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full mb-2">
                👑 Nuevo Anfitrión
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">
                Iniciar Mesa Limpia
              </h2>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-5 font-semibold leading-snug">
                Se limpiará el pedido anterior y empezarás desde cero como Anfitrión de la mesa.
              </p>

              <form onSubmit={handleOverrideSubmit} className="space-y-4">
                <div className="relative text-left">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-1 ml-1">
                    Tu Nombre (Anfitrión)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <IoPerson className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      required
                      maxLength={40}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Daniel, Valentina..."
                      disabled={isJoining}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:bg-white rounded-2xl font-bold text-gray-800 placeholder-gray-400 text-base focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!name.trim() || isJoining}
                  className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] ${
                    !name.trim() || isJoining
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-red-500/30'
                  }`}
                >
                  {isJoining ? 'Iniciando mesa...' : 'Tomar Control e Iniciar'}
                  <IoArrowForward className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              CASO 4: MESA LIBRE - ENTRADA DIRECTA NORMAL (Paso Anfitrión)
             ══════════════════════════════════════════════════════════════════ */}
          {step === 'direct_join' && (
            <div className="animate-in fade-in duration-200">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl shadow-red-500/30 mb-4 transform -rotate-3 hover:rotate-0 transition-transform">
                <IoRestaurant className="w-10 h-10" />
              </div>

              <div className="inline-block bg-yellow-100 text-yellow-800 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                📍 Mesa Escaneada
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">
                ¡Bienvenidos a la Mesa!
              </h2>

              <p className="text-base sm:text-lg font-bold text-gray-700 mb-1">
                ¿Cuál es tu nombre?
              </p>
              <p className="text-xs sm:text-sm text-gray-400 font-medium mb-6">
                Escribe cómo quieres aparecer en el pedido de esta mesa.
              </p>

              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div className="relative text-left">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <IoPerson className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      required
                      maxLength={40}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Juan, Sofía, Carlos..."
                      disabled={isJoining}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:bg-white rounded-2xl font-bold text-gray-800 placeholder-gray-400 text-base focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!name.trim() || isJoining}
                  className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] ${
                    !name.trim() || isJoining
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-red-500/30'
                  }`}
                >
                  {isJoining ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Conectando a la mesa...
                    </>
                  ) : (
                    <>
                      Entrar a la Mesa
                      <IoArrowForward className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <p className="text-[11px] text-gray-400 font-semibold mt-5">
            Deli Burrito • Pedidos Colaborativos en Tiempo Real
          </p>
        </div>
      </div>
    </div>
  );
}
