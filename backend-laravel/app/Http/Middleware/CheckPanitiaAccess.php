<?php

namespace App\Http\Middleware;

use App\Models\Panitia;
use Closure;
use Illuminate\Http\Request;

class CheckPanitiaAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        $panitiaId = $request->header('X-Active-Panitia');

        if ($user->role === 'Admin') {
            if ($panitiaId) {
                $panitia = Panitia::where('id', $panitiaId)->where('status', 'active')->first();
                if ($panitia) {
                    $request->merge(['active_panitia_id' => (int) $panitiaId]);
                }
            }
            return $next($request);
        }

        if (!$panitiaId) {
            return response()->json(['message' => 'No active Panitia selected.'], 403);
        }

        $hasAccess = $user->panitia()
            ->where('panitia.id', $panitiaId)
            ->where('panitia.status', 'active')
            ->exists();

        if (!$hasAccess) {
            logAudit('UNAUTHORIZED_PANITIA_ACCESS', 'Panitia', (int) $panitiaId,
                'User attempted to access Panitia they are not assigned to', $user->id);
            return response()->json(['message' => 'You do not have access to this Panitia.'], 403);
        }

        $request->merge(['active_panitia_id' => (int) $panitiaId]);
        return $next($request);
    }
}
