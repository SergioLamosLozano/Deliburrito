<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Reemplaza la tabla pivote category_option_dependency (descartada).
 * Crea la entidad ProductVariation: variaciones de un tipo de producto
 * (ej. Sencilla / Mixta / Doble para Tortihamburguesa) con precio base propio.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Eliminar la tabla anterior si existe (pivot descartado)
        Schema::dropIfExists('category_option_dependency');

        Schema::create('product_variations', function (Blueprint $table) {
            $table->id();
            // A qué tipo de producto pertenece esta variación
            // ej. 'tortihamburguesa', 'burrito'
            $table->string('product_target');
            // Nombre de la variación, ej. 'Sencilla', 'Mixta', 'Doble'
            $table->string('name');
            // Precio base de esta variación
            $table->decimal('base_price', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variations');
    }
};
