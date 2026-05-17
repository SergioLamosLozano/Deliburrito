<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // ── Validar que las variables de entorno del admin estén definidas ─
        $adminEmail    = env('ADMIN_EMAIL', 'deliburrito.caicedonia@gmail.com');
        $adminPassword = env('ADMIN_PASSWORD', '089218Jamb');
        $adminName     = env('ADMIN_NAME', 'Administrador');

        // ── Usuario administrador ──────────────────────────────────────────
        DB::table('users')->insertOrIgnore([
            'name'       => $adminName,
            'email'      => $adminEmail,
            'password'   => Hash::make($adminPassword),
            'role'       => 'admin',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ── Configuración inicial ──────────────────────────────────────────
        DB::table('settings')->insertOrIgnore([
            'key'         => 'costo_domicilio',
            'value'       => '5000',
            'description' => 'Costo fijo por domicilio',
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        DB::table('settings')->insertOrIgnore([
            'key'         => 'mensaje_pedido_aceptado',
            'value'       => '¡Gracias por elegir Deli Burrito!',
            'description' => 'Mensaje adicional de WhatsApp cuando se acepta un pedido',
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        DB::table('settings')->insertOrIgnore([
            'key'         => 'mensaje_pedido_cancelado',
            'value'       => 'Disculpa las molestias.',
            'description' => 'Mensaje adicional de WhatsApp cuando se cancela un pedido',
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        // ── Categorías y opciones del menú ─────────────────────────────────

        // 1. Proteína Principal (obligatoria, 1 selección)
        $proteinaPrincipalId = DB::table('categories')->insertGetId([
            'name'           => 'Proteína Principal',
            'is_required'    => true,
            'max_selections' => 1,
            'order_index'    => 1,
            'is_active'      => true,
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $proteinaPrincipalId, 'name' => 'Res',         'price' => 4000, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $proteinaPrincipalId, 'name' => 'Cerdo Pesto', 'price' => 4500, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $proteinaPrincipalId, 'name' => 'Costilla',    'price' => 5000, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $proteinaPrincipalId, 'name' => 'Pollo',       'price' => 3500, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 2. Proteínas Adicionales (opcional, hasta 2)
        $proteinasAdicionalesId = DB::table('categories')->insertGetId([
            'name'           => 'Proteínas Adicionales',
            'is_required'    => false,
            'max_selections' => 2,
            'order_index'    => 2,
            'is_active'      => true,
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $proteinasAdicionalesId, 'name' => 'Res Extra',   'price' => 4000, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $proteinasAdicionalesId, 'name' => 'Pollo Extra', 'price' => 3500, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $proteinasAdicionalesId, 'name' => 'Cerdo Extra', 'price' => 4500, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 3. Sabor Crunch (opcional)
        $saborCrunchId = DB::table('categories')->insertGetId([
            'name'           => 'Sabor Crunch',
            'is_required'    => false,
            'max_selections' => 1,
            'order_index'    => 3,
            'is_active'      => true,
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $saborCrunchId, 'name' => 'Papas Crunch',   'price' => 2000, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $saborCrunchId, 'name' => 'Nachos Crunch',  'price' => 2500, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $saborCrunchId, 'name' => 'Plátano Crunch', 'price' => 1500, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 4. Tipo de Queso (opcional)
        $tipoQuesoId = DB::table('categories')->insertGetId([
            'name'           => 'Tipo de Queso',
            'is_required'    => false,
            'max_selections' => 1,
            'order_index'    => 4,
            'is_active'      => true,
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $tipoQuesoId, 'name' => 'Queso Mozzarella', 'price' => 1000, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $tipoQuesoId, 'name' => 'Queso Americano',  'price' =>  800, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $tipoQuesoId, 'name' => 'Doble Queso',      'price' => 1500, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 5. Salsa 1 (opcional)
        $salsa1Id = DB::table('categories')->insertGetId([
            'name'           => 'Salsa 1',
            'is_required'    => false,
            'max_selections' => 1,
            'order_index'    => 5,
            'is_active'      => true,
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $salsa1Id, 'name' => 'Salsa Roja',   'price' => 0, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $salsa1Id, 'name' => 'Salsa Verde',  'price' => 0, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $salsa1Id, 'name' => 'Salsa Blanca', 'price' => 0, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 6. Salsa 2 (opcional)
        $salsa2Id = DB::table('categories')->insertGetId([
            'name'           => 'Salsa 2',
            'is_required'    => false,
            'max_selections' => 1,
            'order_index'    => 6,
            'is_active'      => true,
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $salsa2Id, 'name' => 'Salsa Roja',   'price' =>    0, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $salsa2Id, 'name' => 'Salsa Verde',  'price' =>    0, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $salsa2Id, 'name' => 'Salsa Blanca', 'price' =>    0, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $salsa2Id, 'name' => 'Picante',      'price' =>  500, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 7. Adiciones Extra (Papas, Bebidas, etc.)
        $adicionesId = DB::table('categories')->insertGetId([
            'name'           => 'Adiciones Extra',
            'is_required'    => false,
            'max_selections' => 10,
            'order_index'    => 7,
            'is_active'      => true,
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $adicionesId, 'name' => 'Papas a la Francesa', 'price' => 3000, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $adicionesId, 'name' => 'Aros de Cebolla',     'price' => 2500, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $adicionesId, 'name' => 'Coca Cola',           'price' => 2000, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $adicionesId, 'name' => 'Agua',                'price' => 1000, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $adicionesId, 'name' => 'Cerveza',             'price' => 5000, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
