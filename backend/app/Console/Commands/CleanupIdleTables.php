<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TableSession;
use App\Models\Table;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CleanupIdleTables extends Command
{
    /**
     * El nombre y la firma del comando de consola.
     *
     * @var string
     */
    protected $signature = 'tables:cleanup-idle {--minutes=2 : Umbral de minutos de inactividad}';

    /**
     * La descripción del comando de consola.
     *
     * @var string
     */
    protected $description = 'Libera automáticamente las mesas físicas con sesiones inactivas por más de 2 minutos.';

    /**
     * Ejecuta el comando de consola.
     */
    public function handle(): int
    {
        $minutes = (int) $this->option('minutes');
        if ($minutes <= 0) {
            $minutes = 2;
        }

        $cutoff = Carbon::now()->subMinutes($minutes);
        $this->info("Buscando sesiones de mesa inactivas antes de: {$cutoff->toDateTimeString()} ({$minutes} min)");

        // Sesiones inactivas: last_active_at < cutoff O (last_active_at IS NULL y created_at < cutoff)
        $idleSessions = TableSession::with('table')
            ->where(function ($query) use ($cutoff) {
                $query->where('last_active_at', '<', $cutoff)
                      ->orWhere(function ($sub) use ($cutoff) {
                          $sub->whereNull('last_active_at')
                              ->where('created_at', '<', $cutoff);
                      });
            })
            ->get();

        if ($idleSessions->isEmpty()) {
            $this->info("No hay mesas inactivas para liberar.");
            return Command::SUCCESS;
        }

        $freedCount = 0;

        foreach ($idleSessions as $session) {
            DB::transaction(function () use ($session, &$freedCount) {
                $table = $session->table;
                $tableNumber = $table ? $table->number : $session->table_id;

                // 1. Eliminar items del carrito temporal y la sesión
                $session->cartItems()->delete();
                $session->delete();

                // 2. Liberar la mesa física asociada si no tiene otra sesión activa
                if ($table) {
                    $hasOtherActiveSessions = TableSession::where('table_id', $table->id)->exists();
                    if (!$hasOtherActiveSessions) {
                        $table->update(['status' => 'free']);
                    }
                }

                $this->line(" - Mesa #{$tableNumber} liberada (Sesión ID {$session->id} eliminada por inactividad).");
                $freedCount++;
            });
        }

        $this->info("Proceso completado: {$freedCount} sesión(es) huérfana(s) eliminada(s) y mesa(s) liberada(s).");

        return Command::SUCCESS;
    }
}
