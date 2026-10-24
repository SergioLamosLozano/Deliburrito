<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name','customer_phone','customer_address','table_number','table_session_id','delivery_type','observations','delivery_cost','subtotal','total','status'
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function tableSession()
    {
        return $this->belongsTo(TableSession::class, 'table_session_id');
    }
}
