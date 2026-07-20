<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckUserActive
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && !$user->is_active) {
            $user->tokens()->delete();
            return response()->json(['message' => 'Your account has been deactivated. Please contact an administrator.'], 403);
        }

        if ($user && $user->account_status !== 'Approved') {
            $user->tokens()->delete();
            return response()->json(['message' => 'Your account has not been approved yet.'], 403);
        }

        return $next($request);
    }
}
