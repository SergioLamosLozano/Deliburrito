<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;

class User extends Authenticatable
{
    use HasFactory;

    /**
     * MEDIA-01: Solo name y email son asignables masivamente.
     * password y role se asignan siempre de forma explicita en el codigo.
     */
    protected $fillable = ['name', 'email'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Mutator: hashea la contrasena automaticamente al asignarla directamente.
     * Detecta si ya esta hasheada (bcrypt) para no doble-hashear.
     */
    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = str_starts_with($value, '$2y$') || str_starts_with($value, '$2a$')
            ? $value
            : Hash::make($value);
    }
}