<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariation extends Model
{
    use HasFactory;

    protected $fillable = ['product_target', 'name', 'description', 'price', 'is_active'];

    protected $casts = [
        'price'     => 'float',
        'is_active' => 'boolean',
    ];

    /**
     * Categorías que están habilitadas para esta variación.
     */
    public function categories()
    {
        return $this->belongsToMany(Category::class, 'category_variation');
    }
}
