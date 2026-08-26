<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyCustomer extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_phone',
        'last_customer_name',
        'last_redeemed_orders_total',
        'last_redeemed_at',
    ];

    protected $casts = [
        'last_redeemed_at' => 'datetime',
        'last_redeemed_orders_total' => 'integer',
    ];
}