<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Models\TableSession;
use App\Models\TableCartItem;
use App\Models\ProductType;

class TableCartController extends Controller
{
    /**
     * 1. POST /api/tables/cart/add
     * Agrega un nuevo producto armado por un comensal al carrito colaborativo de la mesa.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function addItem(Request $request): JsonResponse
    {
        // 1. Validar parámetros requeridos
        $validator = Validator::make($request->all(), [
            'session_id' => 'required|integer',
            'product_id' => 'required',
            'details'    => 'required',
            'price'      => 'required|numeric|min:0',
            'guest_name' => 'required|string|max:255',
        ], [
            'session_id.required' => 'El id de la sesión de mesa es obligatorio.',
            'product_id.required' => 'El id del producto es obligatorio.',
            'details.required'    => 'La configuración y detalles del burrito son obligatorios.',
            'price.required'      => 'El precio del producto es obligatorio.',
            'guest_name.required' => 'El nombre del comensal es obligatorio.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'      => false,
                'message' => 'Datos incompletos o inválidos.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // 2. Verificar que la sesión de mesa exista y esté activa
        $session = TableSession::with('table')->find($validated['session_id']);

        if (!$session) {
            return response()->json([
                'ok'      => false,
                'message' => 'Sesión de mesa no encontrada.',
            ], 404);
        }

        // 3. Verificar estado de la mesa física
        if ($session->table && $session->table->status === 'locked') {
            return response()->json([
                'ok'      => false,
                'message' => 'La mesa ya cerró su pedido y no se pueden agregar más productos.',
            ], 403);
        }

        // 4. Resolver product_id (admite ID numérico o slug del ProductType)
        $productId = $validated['product_id'];
        if (!is_numeric($productId) || !ProductType::where('id', $productId)->exists()) {
            $foundProduct = ProductType::where('slug', $productId)->first();
            if ($foundProduct) {
                $productId = $foundProduct->id;
            } else {
                // Fallback de contingencia: primer tipo de producto disponible en el sistema
                $defaultProduct = ProductType::first();
                if ($defaultProduct) {
                    $productId = $defaultProduct->id;
                } else {
                    return response()->json([
                        'ok'      => false,
                        'message' => 'El producto especificado no es válido en el sistema.',
                    ], 422);
                }
            }
        }

        // 5. Procesar el campo details (puede llegar como string JSON o array asociativo)
        $details = $validated['details'];
        if (is_string($details)) {
            $decoded = json_decode($details, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $details = $decoded;
            } else {
                $details = ['raw' => $details];
            }
        }

        // 6. Crear el registro en table_cart_items con status 'building'
        $item = TableCartItem::create([
            'table_session_id' => $session->id,
            'guest_name'       => trim($validated['guest_name']),
            'product_id'       => (int) $productId,
            'details'          => $details,
            'price'            => (float) $validated['price'],
            'status'           => 'building',
        ]);

        // 7. Cargar lista actualizada completa de ítems de la sesión
        $items = TableCartItem::with('product')
            ->where('table_session_id', $session->id)
            ->orderBy('created_at', 'asc')
            ->get();

        // Agrupar por nombre de comensal
        $byGuest = $items->groupBy('guest_name');

        return response()->json([
            'ok'          => true,
            'message'     => 'Producto agregado a la sala colaborativa exitosamente.',
            'item'        => $item->load('product'),
            'session_id'  => $session->id,
            'items'       => $items,
            'by_guest'    => $byGuest,
            'total_items' => $items->count(),
            'total_price' => (float) $items->sum('price'),
        ], 201);
    }

    /**
     * 2. GET /api/tables/cart/{session_id}
     * Devuelve todos los registros de table_cart_items de la sesión de mesa dada,
     * agrupando los datos por invitado para que el frontend sepa quién pidió qué.
     *
     * @param int|string $sessionId
     * @return JsonResponse
     */
    public function getItems(int|string $sessionId): JsonResponse
    {
        $session = TableSession::with('table')->find($sessionId);

        if (!$session) {
            return response()->json([
                'ok'      => false,
                'message' => 'Sesión de mesa no encontrada.',
            ], 404);
        }

        // Obtener todos los ítems de la sala
        $items = TableCartItem::with('product')
            ->where('table_session_id', $session->id)
            ->orderBy('created_at', 'asc')
            ->get();

        // Agrupación para saber quién pidió qué
        $byGuest = $items->groupBy('guest_name');

        return response()->json([
            'ok'          => true,
            'session_id'  => (int) $session->id,
            'table'       => [
                'id'     => $session->table?->id,
                'number' => $session->table?->number,
                'status' => $session->table?->status,
            ],
            'items'       => $items,
            'by_guest'    => $byGuest,
            'total_items' => $items->count(),
            'total_price' => (float) $items->sum('price'),
        ], 200);
    }

    /**
     * 3. DELETE /api/tables/cart/item/{id}
     * Elimina un producto del carrito colaborativo de la mesa.
     * Regla estricta: Solo quien lo armó (guest_name coincidente) puede eliminarlo.
     *
     * @param Request $request
     * @param int|string $id
     * @return JsonResponse
     */
    public function deleteItem(Request $request, int|string $id): JsonResponse
    {
        $sessionId = $request->input('session_id') ?? $request->query('session_id');
        $guestName = $request->input('guest_name') ?? $request->query('guest_name');

        if (!$sessionId || !$guestName) {
            return response()->json([
                'ok'      => false,
                'message' => 'El session_id y guest_name son obligatorios.',
            ], 422);
        }

        $item = TableCartItem::with('session.table')->find($id);

        if (!$item) {
            return response()->json([
                'ok'      => false,
                'message' => 'Producto no encontrado en el carrito de la mesa.',
            ], 404);
        }

        if ((int)$item->table_session_id !== (int)$sessionId) {
            return response()->json([
                'ok'      => false,
                'message' => 'El producto no pertenece a la sesión de mesa especificada.',
            ], 400);
        }

        // Regla de negocio estricta: verificar que el guest_name coincida exactamente
        if (trim($item->guest_name) !== trim($guestName)) {
            return response()->json([
                'ok'      => false,
                'message' => 'No puedes modificar los productos de otra persona',
            ], 403);
        }

        // Verificar si la mesa física está bloqueada
        $table = $item->session?->table;
        if ($table && $table->status === 'locked') {
            return response()->json([
                'ok'      => false,
                'message' => 'La mesa ya cerró su pedido y no se pueden eliminar productos.',
            ], 403);
        }

        $item->delete();

        // Obtener lista actualizada
        $items = TableCartItem::with('product')
            ->where('table_session_id', $sessionId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'ok'          => true,
            'message'     => 'Producto eliminado del carrito de la mesa exitosamente.',
            'session_id'  => (int)$sessionId,
            'items'       => $items,
            'by_guest'    => $items->groupBy('guest_name'),
            'total_items' => $items->count(),
            'total_price' => (float)$items->sum('price'),
        ], 200);
    }

    /**
     * 4. PUT /api/tables/cart/item/{id}
     * Actualiza la configuración de un producto del carrito colaborativo.
     * Regla estricta: Solo quien lo armó (guest_name coincidente) puede actualizarlo.
     *
     * @param Request $request
     * @param int|string $id
     * @return JsonResponse
     */
    public function updateItem(Request $request, int|string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'session_id' => 'required|integer',
            'guest_name' => 'required|string|max:255',
            'details'    => 'required',
            'price'      => 'required|numeric|min:0',
            'product_id' => 'nullable',
        ], [
            'session_id.required' => 'El id de la sesión de mesa es obligatorio.',
            'guest_name.required' => 'El nombre del comensal es obligatorio.',
            'details.required'    => 'Los detalles del producto son obligatorios.',
            'price.required'      => 'El precio del producto es obligatorio.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'      => false,
                'message' => 'Datos incompletos o inválidos.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $item = TableCartItem::with('session.table')->find($id);

        if (!$item) {
            return response()->json([
                'ok'      => false,
                'message' => 'Producto no encontrado en el carrito de la mesa.',
            ], 404);
        }

        if ((int)$item->table_session_id !== (int)$validated['session_id']) {
            return response()->json([
                'ok'      => false,
                'message' => 'El producto no pertenece a la sesión de mesa especificada.',
            ], 400);
        }

        // Regla de negocio estricta: verificar que el guest_name coincida exactamente
        if (trim($item->guest_name) !== trim($validated['guest_name'])) {
            return response()->json([
                'ok'      => false,
                'message' => 'No puedes modificar los productos de otra persona',
            ], 403);
        }

        // Verificar si la mesa física está bloqueada
        $table = $item->session?->table;
        if ($table && $table->status === 'locked') {
            return response()->json([
                'ok'      => false,
                'message' => 'La mesa ya cerró su pedido y no se pueden modificar productos.',
            ], 403);
        }

        // Procesar details
        $details = $validated['details'];
        if (is_string($details)) {
            $decoded = json_decode($details, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $details = $decoded;
            } else {
                $details = ['raw' => $details];
            }
        }

        $updateData = [
            'details' => $details,
            'price'   => (float)$validated['price'],
        ];

        // Resolver product_id si viene especificado
        if (!empty($validated['product_id'])) {
            $productId = $validated['product_id'];
            if (!is_numeric($productId) || !ProductType::where('id', $productId)->exists()) {
                $foundProduct = ProductType::where('slug', $productId)->first();
                if ($foundProduct) {
                    $productId = $foundProduct->id;
                }
            }
            if (is_numeric($productId)) {
                $updateData['product_id'] = (int)$productId;
            }
        }

        $item->update($updateData);

        // Obtener lista actualizada completa de ítems de la sesión
        $items = TableCartItem::with('product')
            ->where('table_session_id', $validated['session_id'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'ok'          => true,
            'message'     => 'Producto actualizado en la sala colaborativa exitosamente.',
            'item'        => $item->fresh()->load('product'),
            'session_id'  => (int)$validated['session_id'],
            'items'       => $items,
            'by_guest'    => $items->groupBy('guest_name'),
            'total_items' => $items->count(),
            'total_price' => (float)$items->sum('price'),
        ], 200);
    }
}
