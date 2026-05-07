<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla pivote: una categoría puede estar habilitada solo para
 * ciertas variaciones de producto.
 * Si una categoría NO tiene filas aquí → se muestra siempre.
 * Si SÍ tiene filas → solo se muestra cuando la variación activa coincide.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_variation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')
                  ->constrained('categories')
                  ->onDelete('cascade');
            $table->foreignId('product_variation_id')
                  ->constrained('product_variations')
                  ->onDelete('cascade');

            $table->unique(['category_id', 'product_variation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_variation');
    }
};
