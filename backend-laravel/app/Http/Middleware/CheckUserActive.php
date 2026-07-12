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
        return $next($request);
    }
}
