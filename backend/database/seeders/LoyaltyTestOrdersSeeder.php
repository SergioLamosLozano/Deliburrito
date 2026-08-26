<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LoyaltyTestOrdersSeeder extends Seeder
{
    public function run(): void
    {
        $targetPhone = '3043515689';
        $targetName = 'Cliente Prueba Fidelización';
        $now = Carbon::now();

        DB::table('settings')->updateOrInsert(
            ['key' => 'loyalty_required_orders'],
            [
                'value' => '15',
                'description' => 'Cantidad de pedidos requeridos para premio de fidelización',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('settings')->updateOrInsert(
            ['key' => 'loyalty_message_template'],
            [
                'value' => '¡Felicidades! Tienes un regalo por tus 15 pedidos.',
                'description' => 'Plantilla del mensaje de fidelización',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('loyalty_customers')->where('customer_phone', $targetPhone)->delete();
        DB::table('orders')->where('customer_phone', $targetPhone)->delete();

        $proteinOption = DB::table('options')->where('name', 'Res')->value('id')
            ?? DB::table('options')->where('name', 'Pollo')->value('id');
        $sauceOption = DB::table('options')->where('name', 'Salsa Roja')->value('id')
            ?? DB::table('options')->where('name', 'Salsa Verde')->value('id');
        $addonOption = DB::table('options')->where('name', 'Papas a la Francesa')->value('id')
            ?? DB::table('options')->where('name', 'Agua')->value('id');

        $requiredOptions = array_values(array_filter([$proteinOption, $sauceOption, $addonOption]));

        if (count($requiredOptions) === 0) {
            return;
        }

        for ($i = 0; $i < 15; $i++) {
            $createdAt = $now->copy()->subDays(14 - $i)->setTime(12, 0, 0);
            $total = 18000 + ($i * 500);

            $orderId = DB::table('orders')->insertGetId([
                'customer_name' => $targetName,
                'customer_phone' => $targetPhone,
                'customer_address' => null,
                'table_number' => null,
                'delivery_type' => 'local',
                'observations' => 'Pedido de prueba para fidelización',
                'delivery_cost' => 0,
                'subtotal' => $total,
                'total' => $total,
                'status' => 'aceptado',
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            $orderItemId = DB::table('order_items')->insertGetId([
                'order_id' => $orderId,
                'product_type' => 'burrito',
                'variation_name' => 'Burrito de prueba',
                'item_total' => $total,
                'notes' => 'Seed de fidelización',
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            foreach ($requiredOptions as $optionId) {
                DB::table('order_item_options')->insert([
                    'order_item_id' => $orderItemId,
                    'option_id' => $optionId,
                    'quantity' => 1,
                    'price_charged' => 0,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }
        }
    }
}