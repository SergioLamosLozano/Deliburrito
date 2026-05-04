<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CategoriesOptionsSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Proteína Principal (obligatoria, 1 selección)
        $proteinaPrincipalId = DB::table('categories')->insertGetId([
            'name' => 'Proteína Principal',
            'is_required' => true,
            'max_selections' => 1,
            'order_index' => 1,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $proteinaPrincipalId, 'name' => 'Res', 'price_base' => 13000, 'price_extra' => 4000, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $proteinaPrincipalId, 'name' => 'Cerdo Pesto', 'price_base' => 14000, 'price_extra' => 4500, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $proteinaPrincipalId, 'name' => 'Costilla', 'price_base' => 15000, 'price_extra' => 5000, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $proteinaPrincipalId, 'name' => 'Pollo', 'price_base' => 12000, 'price_extra' => 3500, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
        ]);

        // 2. Proteínas Adicionales (opcional, hasta 2)
        $proteinasAdicionalesId = DB::table('categories')->insertGetId([
            'name' => 'Proteínas Adicionales',
            'is_required' => false,
            'max_selections' => 2,
            'order_index' => 2,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $proteinasAdicionalesId, 'name' => 'Res Extra', 'price_base' => 0, 'price_extra' => 4000, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $proteinasAdicionalesId, 'name' => 'Pollo Extra', 'price_base' => 0, 'price_extra' => 3500, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $proteinasAdicionalesId, 'name' => 'Cerdo Extra', 'price_base' => 0, 'price_extra' => 4500, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
        ]);

        // 3. Sabor Crunch (opcional)
        $saborCrunchId = DB::table('categories')->insertGetId([
            'name' => 'Sabor Crunch',
            'is_required' => false,
            'max_selections' => 1,
            'order_index' => 3,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $saborCrunchId, 'name' => 'Papas Crunch', 'price_base' => 0, 'price_extra' => 2000, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $saborCrunchId, 'name' => 'Nachos Crunch', 'price_base' => 0, 'price_extra' => 2500, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $saborCrunchId, 'name' => 'Plátano Crunch', 'price_base' => 0, 'price_extra' => 1500, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
        ]);

        // 4. Tipo de Queso (opcional)
        $tipoQuesoId = DB::table('categories')->insertGetId([
            'name' => 'Tipo de Queso',
            'is_required' => false,
            'max_selections' => 1,
            'order_index' => 4,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $tipoQuesoId, 'name' => 'Queso Mozzarella', 'price_base' => 0, 'price_extra' => 1000, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $tipoQuesoId, 'name' => 'Queso Americano', 'price_base' => 0, 'price_extra' => 800, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $tipoQuesoId, 'name' => 'Doble Queso', 'price_base' => 0, 'price_extra' => 1500, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
        ]);

        // 5. Salsa 1 (opcional)
        $salsa1Id = DB::table('categories')->insertGetId([
            'name' => 'Salsa 1',
            'is_required' => false,
            'max_selections' => 1,
            'order_index' => 5,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $salsa1Id, 'name' => 'Salsa Roja', 'price_base' => 0, 'price_extra' => 0, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $salsa1Id, 'name' => 'Salsa Verde', 'price_base' => 0, 'price_extra' => 0, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $salsa1Id, 'name' => 'Salsa Blanca', 'price_base' => 0, 'price_extra' => 0, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
        ]);

        // 6. Salsa 2 (opcional)
        $salsa2Id = DB::table('categories')->insertGetId([
            'name' => 'Salsa 2',
            'is_required' => false,
            'max_selections' => 1,
            'order_index' => 6,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $salsa2Id, 'name' => 'Salsa Roja', 'price_base' => 0, 'price_extra' => 0, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $salsa2Id, 'name' => 'Salsa Verde', 'price_base' => 0, 'price_extra' => 0, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $salsa2Id, 'name' => 'Salsa Blanca', 'price_base' => 0, 'price_extra' => 0, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $salsa2Id, 'name' => 'Picante', 'price_base' => 0, 'price_extra' => 500, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
        ]);

        // 7. Adiciones Extra (Papas, Bebidas, etc.)
        $adicionesId = DB::table('categories')->insertGetId([
            'name' => 'Adiciones Extra',
            'is_required' => false,
            'max_selections' => 10,
            'order_index' => 7,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('options')->insert([
            ['category_id' => $adicionesId, 'name' => 'Papas a la Francesa', 'price_base' => 0, 'price_extra' => 3000, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $adicionesId, 'name' => 'Aros de Cebolla', 'price_base' => 0, 'price_extra' => 2500, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $adicionesId, 'name' => 'Coca Cola', 'price_base' => 0, 'price_extra' => 2000, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $adicionesId, 'name' => 'Agua', 'price_base' => 0, 'price_extra' => 1000, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
            ['category_id' => $adicionesId, 'name' => 'Cerveza', 'price_base' => 0, 'price_extra' => 5000, 'is_active' => true, 'created_at'=>$now,'updated_at'=>$now],
        ]);
    }
}
