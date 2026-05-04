<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemOption;

class OrderController extends Controller
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
        return Inertia::render('Admin/Orders/Index', compact('orders'));
    }

    public function show(Order $order)
    {
        $this->ensureAdmin();
        $order->load('items.options.option');
        return Inertia::render('Admin/Orders/Show', compact('order'));
    }

    public function accept(Order $order)
    {
        $this->ensureAdmin();
        $order->update(['status' => 'aceptado']);

        // Build a wa.me message for admin to open manually (frontend can use this URL)
        $message = "*Pedido%20aceptado*%0AID:%20{$order->id}%0ANombre:%20{$order->customer_name}%0ATotal:%20{$order->total}";
        $waLink = "https://wa.me/?text={$message}";

        return response()->json(['status' => 'aceptado', 'wa_link' => $waLink]);
    }

    public function cancel(Order $order)
    {
        $this->ensureAdmin();
        $order->update(['status' => 'cancelado']);
        return response()->json(['status' => 'cancelado']);
    }

    public function printComanda(Order $order)
    {
        $this->ensureAdmin();
        $order->load('items.options.option');
        // Return a simple view intended for printing (the frontend can open it in a new tab)
        return Inertia::render('Admin/Orders/Print', compact('order'));
    }
}
