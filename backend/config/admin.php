<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Admin Panel Path
    |--------------------------------------------------------------------------
    | Segmento de URL que prefija todas las rutas del panel de administracion.
    | Cambiar este valor en .env (ADMIN_PATH) y ejecutar:
    |   php artisan route:clear
    |   php artisan config:clear
    */
    'path' => env('ADMIN_PATH', 'admin'),
];
