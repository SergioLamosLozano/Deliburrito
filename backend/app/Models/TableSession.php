<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TableSession extends Model
{
    use HasFactory;

    /**
     * Tabla física asociada al modelo.
     */
    protected $table = 'table_sessions';

    /**
     * Campos asignables de manera masiva.
     */
    protected $fillable = [
        'table_id',
        'host_name',
        'host_device_id',
        'last_active_at',
    ];

    /**
     * Conversión de tipos nativos.
     */
    protected $casts = [
        'last_active_at' => 'datetime',
    ];

    /**
     * Mesa física a la cual pertenece esta sesión de comensales.
     */
    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class, 'table_id');
    }

    /**
     * Ítems temporales agregados por los invitados o anfitrión a esta sesión.
     */
    public function cartItems(): HasMany
    {
        return $this->hasMany(TableCartItem::class, 'table_session_id');
    }

    /**
     * Participantes sentados en la mesa colaborativa (Lobby).
     */
    public function participants(): HasMany
    {
        return $this->hasMany(TableSessionParticipant::class, 'table_session_id');
    }
}
