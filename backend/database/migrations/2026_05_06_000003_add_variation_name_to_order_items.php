<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega el nombre de la variación elegida (ej. "Sencilla", "Mixta")
 * directamente en order_items para no depender de JOINs futuros
 * si la variación es editada o eliminada.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('variation_name', 100)->nullable()->after('product_type');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('variation_name');
        });
    }
};
