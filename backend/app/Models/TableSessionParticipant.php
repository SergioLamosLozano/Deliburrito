<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TableSessionParticipant extends Model
{
    use HasFactory;

    /**
     * Tabla física asociada al modelo.
     */
    protected $table = 'table_session_participants';

    /**
     * Campos asignables de manera masiva.
     */
    protected $fillable = [
        'table_session_id',
        'guest_name',
        'role',
        'status',
    ];

    /**
     * Sesión de mesa a la que pertenece este participante.
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(TableSession::class, 'table_session_id');
    }
}
