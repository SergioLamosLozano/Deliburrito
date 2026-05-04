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
}
