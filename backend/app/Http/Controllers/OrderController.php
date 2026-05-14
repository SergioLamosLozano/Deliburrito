<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemOption;
use App\Models\Option;
use App\Models\Setting;

class OrderController extends Controller
{
    // Public endpoint to receive order payload from frontend
    public function store(Request $request)
    {
        try {
            $payload = $request->validate([
                'customer_name'    => 'required|string|max:255',
                'customer_phone'   => 'required|string|max:50',
                'customer_address' => 'nullable|string|max:1000',
                'delivery_type'    => 'required|in:domicilio,local,recoger',
                'items'            => 'required|array|min:1|max:20',
                'items.*.product_type' => 'required|string|in:burrito,tortihamburguesa',
                'items.*.variation_name' => 'nullable|string|max:255',
                'items.*.notes'    => 'nullable|string|max:500',
                'items.*.options'  => 'required|array',
                'items.*.item_total' => 'required|numeric',
            ]);

            $settingsDelivery = Setting::where('key', 'costo_domicilio')->first();
            $deliveryCostDefault = $settingsDelivery ? (float)$settingsDelivery->value : 0.0;

            $order = null;

            DB::transaction(function () use ($payload, $deliveryCostDefault, &$order) {
                $subtotal = 0.0;

                $order = Order::create([
                    'customer_name' => $payload['customer_name'],
                    'customer_phone' => $payload['customer_phone'],
                    'customer_address' => $payload['customer_address'] ?? null,
                    'delivery_type' => $payload['delivery_type'],
                    'delivery_cost' => ($payload['delivery_type'] === 'domicilio') ? $deliveryCostDefault : 0.0,
                    'subtotal' => 0.0,
                    'total' => 0.0,
                    'status' => 'pendiente',
                ]);

                foreach ($payload['items'] as $itemPayload) {
                    $itemTotal = (float)$itemPayload['item_total'];
                    $subtotal += $itemTotal;

                    $orderItem = OrderItem::create([
                        'order_id'     => $order->id,
                        'product_type' => $itemPayload['product_type'],
                        'variation_name' => $itemPayload['variation_name'] ?? null,
                        'item_total'   => $itemTotal,
                        'notes'        => isset($itemPayload['notes']) ? strip_tags(trim($itemPayload['notes'])) : null,
                    ]);

                    foreach ($itemPayload['options'] as $optPayload) {
                        OrderItemOption::create([
                            'order_item_id' => $orderItem->id,
                            'option_id' => $optPayload['option_id'],
                            'price_charged' => 0,
                        ]);
                    }
                }

                $delivery = ($payload['delivery_type'] === 'domicilio') ? $deliveryCostDefault : 0.0;
                $total = $subtotal + $delivery;

                $order->update(['subtotal' => $subtotal, 'total' => $total, 'delivery_cost' => $delivery]);
            });

            return response()->json(['ok' => true, 'order_id' => $order->id], 201);
        } catch (\Exception $e) {
            \Log::error('Order creation failed: ' . $e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'ok' => false,
                'message' => 'Error interno al crear el pedido: ' . $e->getMessage()
            ], 500);
        }
    }
}
