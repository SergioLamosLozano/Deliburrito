<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_customers', function (Blueprint $table) {
            $table->id();
            $table->string('customer_phone')->unique();
            $table->string('last_customer_name')->nullable();
            $table->unsignedInteger('last_redeemed_orders_total')->default(0);
            $table->timestamp('last_redeemed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_customers');
    }
};