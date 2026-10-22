<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Table extends Model
{
    use HasFactory;

    /**
     * Tabla física asociada al modelo.
     */
    protected $table = 'tables';

    /**
     * Campos asignables de manera masiva.
     */
    protected $fillable = [
        'number',
        'qr_hash',
        'status',
    ];

    /**
     * Casts de atributos.
     */
    protected function casts(): array
    {
        return [
            'number' => 'integer',
        ];
    }

    /**
     * Historial de sesiones asociadas a esta mesa.
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(TableSession::class, 'table_id');
    }

    /**
     * Sesión activa / más reciente de la mesa.
     */
    public function currentSession(): HasOne
    {
        return $this->hasOne(TableSession::class, 'table_id')->latestOfMany();
    }

    /**
     * Todos los productos en carrito acumulados a través de las sesiones de esta mesa.
     */
    public function cartItems(): HasManyThrough
    {
        return $this->hasManyThrough(TableCartItem::class, TableSession::class, 'table_id', 'table_session_id');
    }
}
