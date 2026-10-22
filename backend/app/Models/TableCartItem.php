<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TableCartItem extends Model
{
    use HasFactory;

    /**
     * Tabla física asociada al modelo.
     */
    protected $table = 'table_cart_items';

    /**
     * Campos asignables de manera masiva.
     */
    protected $fillable = [
        'table_session_id',
        'guest_name',
        'product_id',
        'details',
        'price',
        'status',
    ];

    /**
     * Casts de atributos (JSON y decimales).
     */
    protected function casts(): array
    {
        return [
            'details' => 'array',
            'price'   => 'decimal:2',
        ];
    }

    /**
     * Sesión de mesa activa a la que pertenece este ítem del carrito.
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(TableSession::class, 'table_session_id');
    }

    /**
     * Producto base al que hace referencia este ítem.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(ProductType::class, 'product_id');
    }

    /**
     * Scope para filtrar ítems que ya fueron confirmados / listos por el comensal.
     */
    public function scopeReady($query)
    {
        return $query->where('status', 'ready');
    }

    /**
     * Scope para filtrar ítems que todavía se encuentran en proceso de armado.
     */
    public function scopeBuilding($query)
    {
        return $query->where('status', 'building');
    }
}
