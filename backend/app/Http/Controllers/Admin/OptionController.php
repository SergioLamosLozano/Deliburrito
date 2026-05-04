<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Option;
use App\Models\Category;

class OptionController extends Controller
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
        $options = Option::with('category')->get();
        return Inertia::render('Admin/Options/Index', compact('options'));
    }

    public function create()
    {
        $this->ensureAdmin();
        $categories = Category::where('is_active', true)->orderBy('order_index')->get();
        return Inertia::render('Admin/Options/Create', compact('categories'));
    }

    public function store(Request $request)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'price_base' => 'nullable|numeric|min:0',
            'price_extra' => 'nullable|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        Option::create($data);
        return redirect()->route('admin.options.index');
    }

    public function edit(Option $option)
    {
        $this->ensureAdmin();
        $categories = Category::where('is_active', true)->orderBy('order_index')->get();
        return Inertia::render('Admin/Options/Edit', compact('option','categories'));
    }

    public function update(Request $request, Option $option)
    {
        $this->ensureAdmin();
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'price_base' => 'nullable|numeric|min:0',
            'price_extra' => 'nullable|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $option->update($data);
        return redirect()->route('admin.options.index');
    }

    public function destroy(Option $option)
    {
        $this->ensureAdmin();
        $option->delete();
        return redirect()->route('admin.options.index');
    }

    public function toggleActive(Option $option)
    {
        $this->ensureAdmin();
        $option->update(['is_active' => !$option->is_active]);
        return redirect()->back();
    }
}
