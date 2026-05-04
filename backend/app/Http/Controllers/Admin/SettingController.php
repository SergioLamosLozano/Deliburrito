<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Setting;

class SettingController extends Controller
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

        $settings = [];
        foreach (['costo_domicilio'] as $key) {
            $setting = Setting::where('key', $key)->first();
            $settings[$key] = $setting ? $setting->value : ($key === 'costo_domicilio' ? 5000 : null);
        }

        return Inertia::render('Admin/Settings', compact('settings'));
    }

    public function update(Request $request)
    {
        $this->ensureAdmin();

        $data = $request->validate([
            'costo_domicilio' => 'required|numeric|min:0',
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'description' => ucfirst(str_replace('_', ' ', $key))]
            );
        }

        return redirect()->back()->with('message', 'Configuración guardada correctamente');
    }
}
