<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\OptionController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductVariationController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SettingController;

// ── Raíz ──────────────────────────────────────────────────────────────────
Route::get('/', function () {
    return file_get_contents(public_path('index.html'));
});

// ── Endpoint para inicializar la cookie CSRF (necesario para el fetch de React) ──
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['ok' => true]);
});

// ── API pública del frontend ───────────────────────────────────────────────
Route::get('/menu',         [App\Http\Controllers\MenuController::class, 'index'])->name('menu.index');
Route::get('/categories',   [App\Http\Controllers\MenuController::class, 'index']); // alias legacy
Route::get('/public-config',[App\Http\Controllers\MenuController::class, 'publicConfig'])->name('public.config');
Route::get('/variations',   [App\Http\Controllers\MenuController::class, 'variations'])->name('variations.index');

// POST /orders con throttle: máximo 10 pedidos por minuto por IP
Route::post('/orders', [App\Http\Controllers\OrderController::class, 'store'])
    ->name('orders.store')
    ->middleware('throttle:10,1');

// ── URL del panel admin leída desde config/admin.php → .env ADMIN_PATH ───
// Usar config() en lugar de env() garantiza que funcione con y sin caché de config
$adminPath = config('admin.path', 'admin');

// Rutas de autenticación (fuera del grupo protegido)
Route::get("{$adminPath}/acceso",  [AuthController::class, 'showLogin'])->name('admin.login');
Route::post("{$adminPath}/acceso", [AuthController::class, 'login'])
    ->name('admin.login.post')
    ->middleware('throttle:5,1');   // 5 intentos de login por minuto por IP
Route::post("{$adminPath}/salir",  [AuthController::class, 'logout'])->name('admin.logout');

// ── Panel admin protegido: requiere sesión autenticada + rol admin ─────────
Route::prefix($adminPath)->name('admin.')->middleware(['auth', 'admin'])->group(function () {

    // Categorías
    Route::get('categories/toggle/{category}', [CategoryController::class, 'toggleActive'])->name('categories.toggle');
    Route::resource('categories', CategoryController::class)->names('categories');

    // Opciones
    Route::get('options/toggle/{option}', [OptionController::class, 'toggleActive'])->name('options.toggle');
    Route::resource('options', OptionController::class)->names('options');

    // Variaciones de Producto
    Route::get('product-variations/toggle/{productVariation}', [ProductVariationController::class, 'toggleActive'])->name('product-variations.toggle');
    Route::resource('product-variations', ProductVariationController::class)
        ->names('product-variations')
        ->only(['index', 'store', 'update', 'destroy']);

    // Pedidos
    Route::get('orders',                 [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/{order}',         [OrderController::class, 'show'])->name('orders.show');
    Route::post('orders/{order}/accept', [OrderController::class, 'accept'])->name('orders.accept');
    Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    Route::get('orders/{order}/print',   [OrderController::class, 'printComanda'])->name('orders.print');

    // Reportes
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');

    // Configuración
    Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
    Route::put('settings', [SettingController::class, 'update'])->name('settings.update');
});
