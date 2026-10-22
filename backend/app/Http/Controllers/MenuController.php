<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Setting;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        // Si el cliente entra escaneando QR con /menu?mesa=... o navegando directamente desde el navegador
        if ($request->has('mesa') || ($request->header('Sec-Fetch-Dest') === 'document' && $request->acceptsHtml())) {
            $indexPath = public_path('index.html');
            if (file_exists($indexPath)) {
                return response(file_get_contents($indexPath))->header('Content-Type', 'text/html; charset=UTF-8');
            }
        }

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
        $allowed  = ['costo_domicilio', 'comercio_abierto'];
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
