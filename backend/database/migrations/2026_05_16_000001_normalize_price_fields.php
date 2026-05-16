<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Normaliza los campos de precio:
 *
 * options:
 *   - Renombra price_extra → price  (es el precio que se suma al total)
 *   - Elimina price_base            (nunca se usó en el cálculo del frontend)
 *
 * product_variations:
 *   - Renombra base_price → price
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── options ──────────────────────────────────────────────────────
        Schema::table('options', function (Blueprint $table) {
            // Agregar la nueva columna price con el valor de price_extra
            $table->decimal('price', 10, 2)->default(0)->after('name');
        });

        // Copiar los valores de price_extra a price
        DB::statement('UPDATE options SET price = price_extra');

        Schema::table('options', function (Blueprint $table) {
            $table->dropColumn(['price_base', 'price_extra']);
        });

        // ── product_variations ───────────────────────────────────────────
        Schema::table('product_variations', function (Blueprint $table) {
            $table->renameColumn('base_price', 'price');
        });
    }

    public function down(): void
    {
        // ── product_variations ───────────────────────────────────────────
        Schema::table('product_variations', function (Blueprint $table) {
            $table->renameColumn('price', 'base_price');
        });

        // ── options ──────────────────────────────────────────────────────
        Schema::table('options', function (Blueprint $table) {
            $table->decimal('price_base', 10, 2)->default(0)->after('name');
            $table->decimal('price_extra', 10, 2)->default(0)->after('price_base');
        });

        DB::statement('UPDATE options SET price_extra = price');

        Schema::table('options', function (Blueprint $table) {
            $table->dropColumn('price');
        });
    }
};
