<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index()
    {
        $categories = Category::with(['options' => function($query) {
            $query->where('is_active', true);
        }])
        ->where('is_active', true)
        ->orderBy('order_index')
        ->get();

        return response()->json($categories);
    }
}
