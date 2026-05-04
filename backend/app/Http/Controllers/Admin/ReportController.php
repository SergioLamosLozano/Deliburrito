<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\Category;

class ReportController extends Controller
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

        $orders = Order::with('items.options.option')->orderBy('created_at', 'desc')->get();
        $categories = Category::where('is_active', true)->get();

        // Calculate metrics
        $totalRevenue = $orders->sum('total');
        $totalOrders = $orders->count();
        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        return Inertia::render('Admin/Reports', compact('orders', 'categories', 'totalRevenue', 'totalOrders', 'avgOrderValue'));
    }
}
