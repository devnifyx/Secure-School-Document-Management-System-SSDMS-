<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Increment failed attempts
            if ($user) {
                $user->increment('failed_attempts');
                // Lock account after 3 failed attempts
                if ($user->failed_attempts >= 3) {
                    $user->update(['locked_until' => now()->addMinutes(15)]);
                }
                logAudit('LOGIN_FAILED', 'User', $user->id, 'Failed login attempt');
            } else {
                logAudit('LOGIN_FAILED', null, null, "Failed login attempt for email: {$request->email}");
            }
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if account is locked
        if ($user->locked_until && $user->locked_until->isFuture()) {
            logAudit('LOGIN_FAILED_LOCKED', 'User', $user->id, 'Account locked');
            throw ValidationException::withMessages([
                'email' => ['Your account is locked. Please try again later.'],
            ]);
        }

        // Check if account is active
        if (!$user->is_active) {
            logAudit('LOGIN_FAILED_INACTIVE', 'User', $user->id, 'Account inactive');
            throw ValidationException::withMessages([
                'email' => ['Your account is inactive.'],
            ]);
        }

        // Reset failed attempts
        $user->update(['failed_attempts' => 0, 'locked_until' => null]);

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        logAudit('LOGIN_SUCCESS', 'User', $user->id);

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        logAudit('LOGOUT', 'User', $user->id);
        $user->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
