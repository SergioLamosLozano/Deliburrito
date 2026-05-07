<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_option_dependency', function (Blueprint $table) {
            $table->id();
            // La categoría que tiene la condición de visibilidad
            $table->foreignId('category_id')
                  ->constrained('categories')
                  ->onDelete('cascade');
            // La opción que, si fue seleccionada, habilita esa categoría
            $table->foreignId('option_id')
                  ->constrained('options')
                  ->onDelete('cascade');

            // Evitar duplicados
            $table->unique(['category_id', 'option_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_option_dependency');
    }
};
