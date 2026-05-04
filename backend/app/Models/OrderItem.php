<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = ['order_id','product_type','item_total','notes'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function options()
    {
        return $this->hasMany(OrderItemOption::class);
    }
}
