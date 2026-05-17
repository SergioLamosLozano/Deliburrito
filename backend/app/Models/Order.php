<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name','customer_phone','customer_address','table_number','delivery_type','delivery_cost','subtotal','total','status'
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
