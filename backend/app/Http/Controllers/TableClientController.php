<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Table;
use App\Models\TableSession;
use App\Models\TableSessionParticipant;
use App\Models\Order;
use Carbon\Carbon;

class TableClientController extends Controller
{
    /**
     * Unirse o iniciar una sala colaborativa en una mesa física mediante código QR.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function join(Request $request): JsonResponse
    {
        // 1. Validar parámetros (guest_name es opcional para chequear el estado previo de la mesa)
        $validated = $request->validate([
            'qr_hash'    => 'required|string|max:64',
            'guest_name' => 'nullable|string|max:255',
        ]);

        $qrHash = trim($validated['qr_hash']);
        $guestName = trim($validated['guest_name'] ?? '');

        // 2. Buscar la mesa por su qr_hash único
        $table = Table::where('qr_hash', $qrHash)->first();

        if (!$table) {
            return response()->json([
                'ok'      => false,
                'message' => 'Mesa no encontrada. Verifica el código QR escaneado.',
            ], 404);
        }

        // Si la mesa está bloqueada (pedido ya enviado / cocina preparando)
        if ($table->status === 'locked') {
            return response()->json([
                'ok'      => false,
                'message' => 'La mesa ya cerró su pedido y se encuentra en preparación.',
            ], 403);
        }

        // Si no se proporcionó guest_name, devolver estado de la mesa sin iniciar sesión
        if (empty($guestName)) {
            $session = $table->currentSession;
            return response()->json([
                'ok'           => true,
                'table_id'     => $table->id,
                'table_number' => $table->number,
                'status'       => $table->status,
                'host_name'    => $session?->host_name ?: 'el Anfitrión',
            ], 200);
        }

        // 3. Si la mesa está libre (free) -> Crear sesión y asignar rol de ANFITRIÓN (host)
        if ($table->status === 'free') {
            $hostDeviceId = (string) Str::uuid();

            $session = DB::transaction(function () use ($table, $hostDeviceId, $guestName) {
                // Actualizar estado de la mesa física
                $table->update(['status' => 'occupied']);

                // Crear nueva sesión de mesa activa
                $newSession = TableSession::create([
                    'table_id'       => $table->id,
                    'host_name'      => $guestName,
                    'host_device_id' => $hostDeviceId,
                    'last_active_at' => now(),
                ]);

                // Registrar al nuevo anfitrión en el Lobby
                TableSessionParticipant::firstOrCreate([
                    'table_session_id' => $newSession->id,
                    'guest_name'       => $guestName,
                ], [
                    'role'   => 'host',
                    'status' => 'deciding',
                ]);

                return $newSession;
            });

            return response()->json([
                'ok'             => true,
                'table_id'       => $table->id,
                'table_number'   => $table->number,
                'session_id'     => $session->id,
                'host_device_id' => $hostDeviceId,
                'role'           => 'host',
                'guest_name'     => $guestName,
                'host_name'      => $guestName,
                'status'         => 'occupied',
            ], 200);
        }

        // 4. Si la mesa ya está ocupada (occupied) -> Unirse como INVITADO (guest)
        if ($table->status === 'occupied') {
            $session = $table->currentSession;

            // Fallback de consistencia: si no había registro de sesión activo, inicializar como host
            if (!$session) {
                $hostDeviceId = (string) Str::uuid();
                $session = TableSession::create([
                    'table_id'       => $table->id,
                    'host_name'      => $guestName,
                    'host_device_id' => $hostDeviceId,
                    'last_active_at' => now(),
                ]);

                TableSessionParticipant::firstOrCreate([
                    'table_session_id' => $session->id,
                    'guest_name'       => $guestName,
                ], [
                    'role'   => 'host',
                    'status' => 'deciding',
                ]);

                return response()->json([
                    'ok'             => true,
                    'table_id'       => $table->id,
                    'table_number'   => $table->number,
                    'session_id'     => $session->id,
                    'host_device_id' => $hostDeviceId,
                    'role'           => 'host',
                    'guest_name'     => $guestName,
                    'host_name'      => $guestName,
                    'status'         => 'occupied',
                ], 200);
            }

            // Registrar al comensal invitado en el Lobby
            TableSessionParticipant::firstOrCreate([
                'table_session_id' => $session->id,
                'guest_name'       => $guestName,
            ], [
                'role'   => 'guest',
                'status' => 'deciding',
            ]);

            // Para invitados: NUNCA devolver el host_device_id por seguridad
            return response()->json([
                'ok'           => true,
                'table_id'     => $table->id,
                'table_number' => $table->number,
                'session_id'   => $session->id,
                'role'         => 'guest',
                'guest_name'   => $guestName,
                'host_name'    => $session->host_name ?: 'el Anfitrión',
                'status'       => 'occupied',
            ], 200);
        }

        return response()->json([
            'ok'      => false,
            'message' => 'Estado de mesa no válido.',
        ], 400);
    }

    /**
     * Heartbeat (Latido) periódico para mantener activa la sesión de la mesa.
     * Si la sesión existe, actualiza last_active_at con la hora actual.
     * Si no existe (fue liberada o limpiada por inactividad), retorna 404.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function ping(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id'     => 'required|integer',
            'host_device_id' => 'nullable|string|max:255',
        ]);

        $query = TableSession::where('id', $validated['session_id']);

        if (!empty($validated['host_device_id'])) {
            $query->where('host_device_id', $validated['host_device_id']);
        }

        $session = $query->first();

        if (!$session) {
            return response()->json([
                'ok'      => false,
                'message' => 'Sesión de mesa no encontrada o ya expiró por inactividad.',
            ], 404);
        }

        $session->update([
            'last_active_at' => now(),
        ]);

        return response()->json([
            'ok'             => true,
            'message'        => 'Heartbeat recibido exitosamente.',
            'last_active_at' => $session->last_active_at?->toIso8601String() ?? now()->toIso8601String(),
        ], 200);
    }

    /**
     * Sobrescribir y tomar posesión de una mesa ocupada/abandonada como nuevo Anfitrión.
     * Limpia la sesión fantasma anterior y sus carritos temporales, creando una nueva sesión activa.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function override(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_hash'    => 'required|string|max:64',
            'guest_name' => 'required|string|max:255',
        ]);

        $qrHash = trim($validated['qr_hash']);
        $guestName = trim($validated['guest_name']);

        $table = Table::where('qr_hash', $qrHash)->first();

        if (!$table) {
            return response()->json([
                'ok'      => false,
                'message' => 'Mesa no encontrada. Verifica el código QR escaneado.',
            ], 404);
        }

        // Si la mesa está bloqueada (pedido ya enviado a cocina)
        if ($table->status === 'locked') {
            return response()->json([
                'ok'      => false,
                'message' => 'Hay un pedido en curso, pide al cajero que libere la mesa.',
            ], 403);
        }

        $hostDeviceId = (string) Str::uuid();

        $session = DB::transaction(function () use ($table, $hostDeviceId, $guestName) {
            // Eliminar sesiones anteriores y sus ítems de carrito
            $previousSessions = TableSession::where('table_id', $table->id)->get();
            foreach ($previousSessions as $prev) {
                $prev->cartItems()->delete();
                $prev->delete();
            }

            // Asegurar estado occupied en la mesa
            $table->update(['status' => 'occupied']);

            // Crear la nueva sesión activa con el nuevo anfitrión
            $newSession = TableSession::create([
                'table_id'       => $table->id,
                'host_name'      => $guestName,
                'host_device_id' => $hostDeviceId,
                'last_active_at' => now(),
            ]);

            // Registrar nuevo anfitrión en el Lobby
            TableSessionParticipant::create([
                'table_session_id' => $newSession->id,
                'guest_name'       => $guestName,
                'role'             => 'host',
                'status'           => 'deciding',
            ]);

            return $newSession;
        });

        return response()->json([
            'ok'             => true,
            'message'        => 'Mesa reiniciada exitosamente como nuevo Anfitrión.',
            'table_id'       => $table->id,
            'table_number'   => $table->number,
            'session_id'     => $session->id,
            'host_device_id' => $hostDeviceId,
            'role'           => 'host',
            'guest_name'     => $guestName,
            'status'         => 'occupied',
        ], 200);
    }

    /**
     * Obtener el estado del Lobby Multijugador para una sesión de mesa activa.
     * Retorna los comensales sentados, los ítems del carrito agrupados y el estado de la mesa.
     *
     * @param int|string $sessionId
     * @return JsonResponse
     */
    public function lobby($sessionId): JsonResponse
    {
        $session = TableSession::with(['table', 'participants', 'cartItems.product'])->find($sessionId);

        if (!$session) {
            return response()->json([
                'ok'      => false,
                'message' => 'Sesión de mesa no encontrada o ya expiró por inactividad.',
            ], 404);
        }

        $table = $session->table;

        // Ítems de carrito agrupados por comensal
        $cartItems = $session->cartItems;
        $byGuest = [];
        $totalPrice = 0;

        foreach ($cartItems as $item) {
            $guest = $item->guest_name;
            if (!isset($byGuest[$guest])) {
                $byGuest[$guest] = [];
            }
            $byGuest[$guest][] = $item;
            $totalPrice += (float)$item->price;
        }

        // Obtener el último pedido enviado a cocina estrictamente en esta sesión activa.
        // Si el pedido fue cancelado o rechazado, o pertenece a otra sesión anterior, NO debe mostrarse como activo en cocina.
        $lastOrder = Order::where('table_session_id', $session->id)
            ->whereNotIn('status', ['cancelado', 'rechazado'])
            ->with(['items'])
            ->latest('id')
            ->first();

        $lastOrderData = null;
        if ($lastOrder) {
            $rawCreatedAt = $lastOrder->getRawOriginal('created_at');
            $bogotaDate = $rawCreatedAt ? Carbon::parse($rawCreatedAt, 'UTC')->setTimezone('America/Bogota') : $lastOrder->created_at;

            $lastOrderData = [
                'id'             => $lastOrder->id,
                'status'         => $lastOrder->status, // 'pendiente', 'aceptado', 'cancelado'
                'total'          => (float) $lastOrder->total,
                'items_count'    => $lastOrder->items->count(),
                'created_at'     => $bogotaDate?->toIso8601String(),
                'time_formatted' => $bogotaDate?->format('h:i A'),
                'time_ago'       => $bogotaDate?->diffForHumans(),
            ];
        }

        return response()->json([
            'ok'                 => true,
            'table_id'           => $table ? $table->id : $session->table_id,
            'table_number'       => $table ? $table->number : null,
            'table_status'       => $table ? $table->status : 'occupied',
            'session_id'         => $session->id,
            'host_name'          => $session->host_name,
            'participants'       => $session->participants,
            'participants_count' => $session->participants->count(),
            'last_order'         => $lastOrderData,
            'cart' => [
                'items'       => $cartItems,
                'by_guest'    => $byGuest,
                'total_items' => $cartItems->count(),
                'total_price' => $totalPrice,
            ],
        ], 200);
    }

    /**
     * Salir de la sala colaborativa y liberar la mesa física.
     * Busca la sesión por session_id y host_device_id. Si existe, la elimina
     * (lo que borra el carrito y participantes en cascada) y actualiza el status de la mesa a 'free'.
     * Retorna HTTP 200.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function leave(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id'     => 'required|integer',
            'host_device_id' => 'required|string',
        ]);

        $sessionId = (int) $validated['session_id'];
        $hostDeviceId = trim($validated['host_device_id']);

        $session = TableSession::with('table')->find($sessionId);

        // Si la sesión no existe (ya liberada previamente o expirada)
        if (!$session) {
            return response()->json([
                'ok'      => true,
                'message' => 'La sesión ya no existe o la mesa ya ha sido liberada.',
            ], 200);
        }

        // Si existe pero el host_device_id no coincide con el anfitrión registrado
        if ($session->host_device_id && $session->host_device_id !== $hostDeviceId) {
            return response()->json([
                'ok'      => false,
                'message' => 'Solo el anfitrión tiene permisos para cerrar y liberar la mesa.',
            ], 403);
        }

        DB::transaction(function () use ($session) {
            // Actualizar status de la mesa a 'free'
            if ($session->table) {
                $session->table->update(['status' => 'free']);
            } elseif ($session->table_id) {
                Table::where('id', $session->table_id)->update(['status' => 'free']);
            }

            // Eliminar carrito y participantes
            $session->cartItems()->delete();
            $session->participants()->delete();

            // Eliminar la sesión
            $session->delete();
        });

        return response()->json([
            'ok'      => true,
            'message' => 'Mesa liberada exitosamente.',
        ], 200);
    }
}

