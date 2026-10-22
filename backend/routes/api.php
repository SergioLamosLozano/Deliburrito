<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TableClientController;
use App\Http\Controllers\TableCartController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Rutas públicas y de API para clientes y salas colaborativas de Deli Burrito.
|
*/

Route::post('/tables/join', [TableClientController::class, 'join'])->name('api.tables.join');
Route::post('/tables/override', [TableClientController::class, 'override'])->name('api.tables.override');
Route::post('/tables/ping', [TableClientController::class, 'ping'])->name('api.tables.ping');
Route::post('/tables/leave', [TableClientController::class, 'leave'])->name('api.tables.leave');
Route::get('/tables/{session_id}/lobby', [TableClientController::class, 'lobby'])->name('api.tables.lobby');

// Rutas de Carrito Colaborativo de Mesas (Salas Multijugador)
Route::prefix('tables/cart')->name('api.tables.cart.')->group(function () {
    Route::post('/add', [TableCartController::class, 'addItem'])->name('add');
    Route::get('/{session_id}', [TableCartController::class, 'getItems'])->name('get');
    Route::delete('/item/{id}', [TableCartController::class, 'deleteItem'])->name('item.delete');
    Route::put('/item/{id}', [TableCartController::class, 'updateItem'])->name('item.update');
});
