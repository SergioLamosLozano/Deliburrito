<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyCustomer;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LoyaltyController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    protected function ensureAdmin()
    {
        if (!auth()->user() || auth()->user()->role !== 'admin') {
            abort(403);
        }
    }

    public function index()
    {
        $this->ensureAdmin();

        $requiredOrdersSetting = Setting::firstOrCreate(
            ['key' => 'loyalty_required_orders'],
            [
                'value' => '15',
                'description' => 'Cantidad de pedidos requeridos para premio de fidelización',
            ]
        );

        $templateSetting = Setting::firstOrCreate(
            ['key' => 'loyalty_message_template'],
            [
                'value' => '¡Felicidades! Tienes un regalo por tus 15 pedidos.',
                'description' => 'Plantilla del mensaje de fidelización',
            ]
        );

        $requiredOrders = max(1, (int) $requiredOrdersSetting->value);

        $customers = DB::table('orders as o')
            ->leftJoin('loyalty_customers as lc', 'lc.customer_phone', '=', 'o.customer_phone')
            ->select('o.customer_phone')
            ->selectSub(function ($query) {
                $query->from('orders as latest')
                    ->select('latest.customer_name')
                    ->whereColumn('latest.customer_phone', 'o.customer_phone')
                    ->whereNotNull('latest.customer_phone')
                    ->where('latest.customer_phone', '!=', '')
                    ->orderByDesc('latest.created_at')
                    ->orderByDesc('latest.id')
                    ->limit(1);
            }, 'latest_customer_name')
            ->selectRaw('COUNT(*) as total_orders')
            ->selectRaw('GREATEST(COUNT(*) - COALESCE(lc.last_redeemed_orders_total, 0), 0) as orders_since_last_reward')
            ->selectRaw('CASE WHEN GREATEST(COUNT(*) - COALESCE(lc.last_redeemed_orders_total, 0), 0) >= ? THEN 1 ELSE 0 END as rewards_available', [$requiredOrders])
            ->where('o.status', 'aceptado')
            ->whereNotNull('o.customer_phone')
            ->where('o.customer_phone', '!=', '')
            ->whereRaw('(lc.customer_phone IS NULL OR lc.customer_phone = o.customer_phone)')
            ->groupBy('o.customer_phone')
            ->groupBy('lc.last_redeemed_orders_total')
            ->orderByDesc('total_orders')
            ->orderBy('o.customer_phone')
            ->get()
            ->map(function ($customer) {
                $totalOrders = (int) $customer->total_orders;
                $currentCycleOrders = (int) $customer->orders_since_last_reward;

                return [
                    'customer_name' => trim((string) ($customer->latest_customer_name ?? '')) !== ''
                        ? $customer->latest_customer_name
                        : 'Sin nombre',
                    'customer_phone' => (string) $customer->customer_phone,
                    'total_orders' => $totalOrders,
                    'current_cycle_orders' => $currentCycleOrders,
                    'rewards_available' => (int) $customer->rewards_available,
                    'reward_ready' => $currentCycleOrders >= $requiredOrders,
                ];
            })
            ->values();

        return Inertia::render('Admin/Loyalty/Index', [
            'customers' => $customers,
            'loyaltyMessageTemplate' => $templateSetting->value,
            'loyaltyRequiredOrders' => $requiredOrders,
        ]);
    }

    public function notifyReward(Request $request, string $customerPhone)
    {
        $this->ensureAdmin();

        $customerPhone = preg_replace('/\D+/', '', $customerPhone) ?? '';

        if ($customerPhone === '') {
            abort(422, 'Teléfono inválido');
        }

        $requiredOrdersSetting = Setting::firstOrCreate(
            ['key' => 'loyalty_required_orders'],
            [
                'value' => '15',
                'description' => 'Cantidad de pedidos requeridos para premio de fidelización',
            ]
        );

        $templateSetting = Setting::firstOrCreate(
            ['key' => 'loyalty_message_template'],
            [
                'value' => '¡Felicidades! Tienes un regalo por tus 15 pedidos.',
                'description' => 'Plantilla del mensaje de fidelización',
            ]
        );

        $requiredOrders = max(1, (int) $requiredOrdersSetting->value);

        $totalOrders = DB::table('orders')
            ->where('status', 'aceptado')
            ->where('customer_phone', $customerPhone)
            ->count();

        $loyaltyCustomer = LoyaltyCustomer::firstOrNew(['customer_phone' => $customerPhone]);
        $currentCycleOrders = max(0, $totalOrders - (int) $loyaltyCustomer->last_redeemed_orders_total);

        if ($currentCycleOrders < $requiredOrders) {
            return response()->json([
                'ok' => false,
                'message' => 'Este cliente todavía no alcanza el umbral requerido.',
            ], 422);
        }

        $latestCustomerName = DB::table('orders')
            ->where('status', 'aceptado')
            ->where('customer_phone', $customerPhone)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->value('customer_name');

        $nextRedeemedTotal = $totalOrders;

        $loyaltyCustomer->fill([
            'last_customer_name' => $latestCustomerName,
            'last_redeemed_orders_total' => $nextRedeemedTotal,
            'last_redeemed_at' => now(),
        ])->save();

        $message = trim((string) $templateSetting->value);
        $waLink = 'https://wa.me/' . $customerPhone . '?text=' . rawurlencode($message);

        return response()->json([
            'ok' => true,
            'wa_link' => $waLink,
            'customer_phone' => $customerPhone,
            'current_cycle_orders' => $isProduction ? 0 : $requiredOrders,
            'required_orders' => $requiredOrders,
        ]);
    }

    public function updateMessage(Request $request)
    {
        $this->ensureAdmin();

        $data = $request->validate([
            'loyalty_message_template' => 'required|string|max:1000',
            'loyalty_required_orders' => 'required|integer|min:1|max:9999',
        ]);

        Setting::updateOrCreate(
            ['key' => 'loyalty_message_template'],
            [
                'value' => $data['loyalty_message_template'],
                'description' => 'Plantilla del mensaje de fidelización',
            ]
        );

        Setting::updateOrCreate(
            ['key' => 'loyalty_required_orders'],
            [
                'value' => (string) $data['loyalty_required_orders'],
                'description' => 'Cantidad de pedidos requeridos para premio de fidelización',
            ]
        );

        return redirect()->back()->with('message', 'Plantilla de fidelización guardada correctamente');
    }
}