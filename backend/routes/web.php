<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\OptionController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SettingController;

Route::get('/', function () {
    return 'Deli Burrito Backend - placeholder';
});

// Public API endpoints
Route::get('/menu', [App\Http\Controllers\MenuController::class, 'index'])->name('menu.index');
Route::post('/orders', [App\Http\Controllers\OrderController::class, 'store'])->name('orders.store');
Route::get('/categories', [App\Http\Controllers\MenuController::class, 'index']); // Legacy support for api.php
Route::get('/options', [App\Http\Controllers\Admin\OptionController::class, 'index']); // Legacy support for api.php (filtered in controller usually)

// Admin auth
Route::get('admin/login', [AuthController::class, 'showLogin'])->name('admin.login');
Route::post('admin/login', [AuthController::class, 'login'])->name('admin.login.post');
Route::post('admin/logout', [AuthController::class, 'logout'])->name('admin.logout');

Route::prefix('admin')->name('admin.')->middleware('auth')->group(function () {
    // Categories
    Route::get('categories/toggle/{category}', [CategoryController::class, 'toggleActive'])->name('categories.toggle');
    Route::resource('categories', CategoryController::class)->names('categories');

    // Options
    Route::get('options/toggle/{option}', [OptionController::class, 'toggleActive'])->name('options.toggle');
    Route::resource('options', OptionController::class)->names('options');

    // Orders
    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('orders/{order}/accept', [OrderController::class, 'accept'])->name('orders.accept');
    Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    Route::get('orders/{order}/print', [OrderController::class, 'printComanda'])->name('orders.print');

    // Reports
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');

    // Settings
    Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
    Route::put('settings', [SettingController::class, 'update'])->name('settings.update');
});
