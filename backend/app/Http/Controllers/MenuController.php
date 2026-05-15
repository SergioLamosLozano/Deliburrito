<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Setting;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index()
    {
        $categories = Category::with(['variations', 'options' => function($query) {
            $query->where('is_active', true);
        }])
        ->where('is_active', true)
        ->orderBy('order_index')
        ->get();

        return response()->json($categories);
    }

    /**
     * Expone únicamente las claves de configuración necesarias para el frontend público.
     * Nunca expone la tabla settings completa.
     */
    public function publicConfig()
    {
        $allowed  = ['costo_domicilio'];
        $settings = Setting::whereIn('key', $allowed)->get(['key', 'value']);
        return response()->json($settings);
    }

    public function variations()
    {
        $variations = \App\Models\ProductVariation::where('is_active', true)->get();
        return response()->json($variations);
    }

    public function productTypes()
    {
        $types = \App\Models\ProductType::where('is_active', true)
            ->orderBy('order_index')
            ->get();
        return response()->json($types);
    }
}
