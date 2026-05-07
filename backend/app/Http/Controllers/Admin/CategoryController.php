<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Category;
use App\Models\ProductVariation;

class CategoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    protected function ensureAdmin()
    {
        if (!auth()->user() || auth()->user()->role !== 'admin') {
            abort(403);
        }
    }

    public function index()
    {
        $this->ensureAdmin();
        $categories = Category::withCount('options')->orderBy('order_index')->get();
        return Inertia::render('Admin/Categories/Index', compact('categories'));
    }

    public function create()
    {
        $this->ensureAdmin();

        // Variaciones agrupadas por product_target para los checkboxes del modal
        $variations = ProductVariation::where('is_active', true)
            ->orderBy('product_target')
            ->orderBy('name')
            ->get()
            ->groupBy('product_target');

        return Inertia::render('Admin/Categories/Create', [
            'variations' => $variations,
        ]);
    }

    public function store(Request $request)
    {
        $this->ensureAdmin();

        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'product_type'  => 'required|string|in:burrito,tortihamburguesa,ambos',
            'is_required'   => 'sometimes|boolean',
            'max_selections'=> 'nullable|integer|min:1',
            'order_index'   => 'nullable|integer',
            'is_active'     => 'sometimes|boolean',
            'variation_ids' => 'nullable|array',
            'variation_ids.*' => 'integer|exists:product_variations,id',
        ]);

        $data['is_active'] = $data['is_active'] ?? true;
        $variationIds = $data['variation_ids'] ?? [];
        unset($data['variation_ids']);

        $category = Category::create($data);
        $category->variations()->sync($variationIds);

        return redirect()->route('admin.categories.index');
    }

    public function edit(Category $category)
    {
        $this->ensureAdmin();

        // Pre-cargar variaciones ya asignadas para marcar los checkboxes
        $category->load('variations');

        $variations = ProductVariation::where('is_active', true)
            ->orderBy('product_target')
            ->orderBy('name')
            ->get()
            ->groupBy('product_target');

        return Inertia::render('Admin/Categories/Edit', [
            'category'   => $category,
            'variations' => $variations,
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $this->ensureAdmin();

        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'product_type'  => 'required|string|in:burrito,tortihamburguesa,ambos',
            'is_required'   => 'sometimes|boolean',
            'max_selections'=> 'nullable|integer|min:1',
            'order_index'   => 'nullable|integer',
            'is_active'     => 'sometimes|boolean',
            'variation_ids' => 'nullable|array',
            'variation_ids.*' => 'integer|exists:product_variations,id',
        ]);

        $variationIds = $data['variation_ids'] ?? [];
        unset($data['variation_ids']);

        $category->update($data);
        $category->variations()->sync($variationIds);

        return redirect()->route('admin.categories.index');
    }

    public function destroy(Category $category)
    {
        $this->ensureAdmin();
        $category->delete();
        return redirect()->back();
    }

    public function toggleActive(Category $category)
    {
        $this->ensureAdmin();
        $category->update(['is_active' => !$category->is_active]);
        return redirect()->back();
    }
}
