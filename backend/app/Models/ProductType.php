<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductType extends Model
{
    use HasFactory;

    protected $table = 'product_types';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'emoji',
        'image_path',
        'order_index',
        'is_active',
    ];

    /**
     * Ítems en carritos colaborativos de mesa asociados a este tipo de producto.
     */
    public function tableCartItems(): HasMany
    {
        return $this->hasMany(TableCartItem::class, 'product_id');
    }
}
