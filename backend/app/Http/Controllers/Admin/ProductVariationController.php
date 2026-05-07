<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ProductVariation;

class ProductVariationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    protected function ensureAdmin(): void
    {
        if (!auth()->user() || auth()->user()->role !== 'admin') {
            abort(403);
        }
    }

    public function index()
    {
        $this->ensureAdmin();

        $variations = ProductVariation::orderBy('product_target')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/ProductVariations/Index', compact('variations'));
    }

    public function store(Request $request)
    {
        $this->ensureAdmin();

        $data = $request->validate([
            'product_target' => 'required|string|in:burrito,tortihamburguesa',
            'name'           => 'required|string|max:255',
            'base_price'     => 'required|numeric|min:0',
            'is_active'      => 'sometimes|boolean',
        ]);

        $data['is_active'] = $data['is_active'] ?? true;

        ProductVariation::create($data);

        return redirect()->route('admin.product-variations.index')
            ->with('success', 'Variación creada correctamente.');
    }

    public function update(Request $request, ProductVariation $productVariation)
    {
        $this->ensureAdmin();

        $data = $request->validate([
            'product_target' => 'required|string|in:burrito,tortihamburguesa',
            'name'           => 'required|string|max:255',
            'base_price'     => 'required|numeric|min:0',
            'is_active'      => 'sometimes|boolean',
        ]);

        $productVariation->update($data);

        return redirect()->route('admin.product-variations.index')
            ->with('success', 'Variación actualizada correctamente.');
    }

    public function destroy(ProductVariation $productVariation)
    {
        $this->ensureAdmin();
        $productVariation->delete();

        return redirect()->route('admin.product-variations.index')
            ->with('success', 'Variación eliminada.');
    }

    public function toggleActive(ProductVariation $productVariation)
    {
        $this->ensureAdmin();
        $productVariation->update(['is_active' => !$productVariation->is_active]);

        return redirect()->back();
    }
}
