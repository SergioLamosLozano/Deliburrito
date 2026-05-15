<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\ProductType::updateOrCreate(
            ['slug' => 'burrito'],
            ['name' => 'Burrito', 'description' => 'Tradicional burrito gigante con tus ingredientes favoritos.', 'emoji' => '🌯', 'order_index' => 1]
        );

        \App\Models\ProductType::updateOrCreate(
            ['slug' => 'tortihamburguesa'],
            ['name' => 'Tortihamburguesa', 'description' => 'La mezcla perfecta entre una torta y una hamburguesa.', 'emoji' => '🍔', 'order_index' => 2]
        );
    }
}
