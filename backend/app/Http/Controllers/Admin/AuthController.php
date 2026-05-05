<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Admin/Auth/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $throttleKey = Str::lower($request->input('email')).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors([
                'email' => "Demasiados intentos fallidos. Intenta de nuevo en {$seconds} segundos.",
            ]);
        }

        if (Auth::attempt($credentials, false)) {
            RateLimiter::clear($throttleKey);
            $request->session()->regenerate();
            \Log::info('Admin login exitoso', ['email' => $credentials['email'], 'ip' => $request->ip()]);
            return redirect()->route('admin.orders.index');
        }

        RateLimiter::hit($throttleKey, 60);
        \Log::warning('Intento de login admin fallido', ['email' => $credentials['email'], 'ip' => $request->ip()]);

        return back()->withErrors(['email' => 'Credenciales invalidas.']);
    }

    public function logout(Request $request)
    {
        \Log::info('Admin logout', ['ip' => $request->ip()]);
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('admin.login');
    }
}