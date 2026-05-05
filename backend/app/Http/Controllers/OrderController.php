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
        $payload = $request->validate([
            'customer_name'    => 'required|string|max:255',
            'customer_phone'   => 'required|string|max:50',
            'customer_address' => 'nullable|string|max:1000',
            'delivery_type'    => 'required|in:domicilio,local,recoger',
            'items'            => 'required|array|min:1|max:20',

            // MEDIA-02: product_type restringido a valores conocidos
            'items.*.product_type' => 'required|string|in:burrito,tortihamburguesa',

            // MEDIA-03: notes con límite de longitud
            'items.*.notes'    => 'nullable|string|max:500',

            'items.*.options'  => 'required|array|min:1',

            // BIZ-01: option_id debe existir, estar activo y pertenecer a categoría activa
            'items.*.options.*.option_id' => [
                'required',
                'integer',
                Rule::exists('options', 'id')->where(fn ($q) => $q->where('is_active', true)),
            ],
            'items.*.options.*.is_primary' => 'sometimes|boolean',
        ]);

        $settingsDelivery = Setting::where('key', 'costo_domicilio')->first();
        $deliveryCostDefault = $settingsDelivery ? (float)$settingsDelivery->value : 0.0;

        $order = null;

        DB::transaction(function () use ($payload, $deliveryCostDefault, &$order) {
            $subtotal = 0.0;

            // temporary create order with zero totals
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
                // determine primary option (first with is_primary true or first option)
                $primaryOptionPayload = null;
                foreach ($itemPayload['options'] as $opt) {
                    if (!empty($opt['is_primary'])) {
                        $primaryOptionPayload = $opt;
                        break;
                    }
                }
                if (!$primaryOptionPayload) {
                    $primaryOptionPayload = $itemPayload['options'][0];
                }

                $primaryOption = Option::findOrFail($primaryOptionPayload['option_id']);
                $itemTotal = (float)$primaryOption->price_base;

                // sum extras (price_extra)
                foreach ($itemPayload['options'] as $optPayload) {
                    if ($optPayload['option_id'] == $primaryOption->id) continue;
                    $optModel = Option::findOrFail($optPayload['option_id']);
                    $itemTotal += (float)$optModel->price_extra;
                }

                $orderItem = OrderItem::create([
                    'order_id'     => $order->id,
                    'product_type' => $itemPayload['product_type'],
                    'item_total'   => $itemTotal,
                    // MEDIA-03: sanitizar notas eliminando cualquier etiqueta HTML
                    'notes'        => isset($itemPayload['notes'])
                                        ? strip_tags(trim($itemPayload['notes']))
                                        : null,
                ]);

                // persist options and freeze price_charged
                foreach ($itemPayload['options'] as $optPayload) {
                    $optModel = Option::findOrFail($optPayload['option_id']);
                    $priceCharged = ($optModel->id == $primaryOption->id) ? (float)$optModel->price_base : (float)$optModel->price_extra;

                    OrderItemOption::create([
                        'order_item_id' => $orderItem->id,
                        'option_id' => $optModel->id,
                        'price_charged' => $priceCharged,
                    ]);
                }

                $subtotal += $itemTotal;
            }

            $delivery = ($payload['delivery_type'] === 'domicilio') ? $deliveryCostDefault : 0.0;
            $total = $subtotal + $delivery;

            $order->update(['subtotal' => $subtotal, 'total' => $total, 'delivery_cost' => $delivery]);
        });

        return response()->json(['ok' => true, 'order_id' => $order->id], 201);
    }
}
