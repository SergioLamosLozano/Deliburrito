<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('table_cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_session_id')->constrained('table_sessions')->cascadeOnDelete();
            $table->string('guest_name');
            $table->foreignId('product_id')->constrained('product_types')->cascadeOnDelete();
            $table->json('details');
            $table->decimal('price', 10, 2)->default(0);
            $table->enum('status', ['building', 'ready'])->default('building');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('table_cart_items');
    }
};
