<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'product_type', 'is_required', 'max_selections', 'order_index', 'is_active'];

    public function options()
    {
        return $this->hasMany(Option::class);
    }

    /**
     * Variaciones de producto para las que esta categoría está habilitada.
     * Array vacío = visible siempre.
     * Con entradas = visible solo cuando la variación activa está en este set.
     */
    public function variations()
    {
        return $this->belongsToMany(ProductVariation::class, 'category_variation')->withPivot('max_selections');
    }
}
