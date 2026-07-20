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
            'login' => 'required|string',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->login)
                     ->orWhere('username', $request->login)
                     ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            if ($user) {
                if ($user->role !== 'Admin') {
                    $user->increment('failed_attempts');
                    if ($user->failed_attempts >= 3) {
                        $user->update(['locked_until' => now()->addMinutes(15)]);
                    }
                }
                logAudit('LOGIN_FAILED', 'User', $user->id, 'Failed login attempt', $user->id);
            } else {
                logAudit('LOGIN_FAILED', null, null, "Failed login attempt for: {$request->login}");
            }
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->role !== 'Admin' && $user->locked_until && $user->locked_until->isFuture()) {
            logAudit('LOGIN_FAILED_LOCKED', 'User', $user->id, 'Account locked', $user->id);
            $minutes = (int) now()->diffInMinutes($user->locked_until, true);
            throw ValidationException::withMessages([
                'login' => ["Your account is locked. Try again in {$minutes} minute(s)."],
            ]);
        }

        if (!$user->is_active) {
            logAudit('LOGIN_FAILED_INACTIVE', 'User', $user->id, 'Account inactive', $user->id);
            throw ValidationException::withMessages([
                'login' => ['Your account is inactive.'],
            ]);
        }

        if ($user->account_status !== 'Approved') {
            logAudit('LOGIN_FAILED_NOT_APPROVED', 'User', $user->id, "Account status: {$user->account_status}", $user->id);
            $msg = $user->account_status === 'Pending'
                ? 'Your account is pending administrator approval.'
                : 'Your registration has been rejected.';
            throw ValidationException::withMessages([
                'login' => [$msg],
            ]);
        }

        $user->update(['failed_attempts' => 0, 'locked_until' => null]);

        $token = $user->createToken('auth-token')->plainTextToken;

        logAudit('LOGIN_SUCCESS', 'User', $user->id, null, $user->id);

        $panitiaList = [];
        $needsPanitiaSelection = false;
        $activePanitia = null;

        if ($user->role === 'Teacher') {
            $panitiaList = $user->panitia()
                                ->where('panitia.status', 'active')
                                ->select('panitia.id', 'panitia.name')
                                ->get();

            if ($panitiaList->count() === 1) {
                $activePanitia = $panitiaList->first();
            } elseif ($panitiaList->count() > 1) {
                $needsPanitiaSelection = true;
            }
        }

        return response()->json([
            'user' => $user,
            'token' => $token,
            'panitia_list' => $panitiaList,
            'needs_panitia_selection' => $needsPanitiaSelection,
            'active_panitia' => $activePanitia,
        ]);
    }

    public function selectPanitia(Request $request)
    {
        $request->validate(['panitia_id' => 'required|integer']);

        $user = $request->user();
        $panitia = $user->panitia()
                        ->where('panitia.id', $request->panitia_id)
                        ->where('panitia.status', 'active')
                        ->first();

        if (!$panitia) {
            return response()->json(['message' => 'You do not have access to this Panitia.'], 403);
        }

        logAudit('PANITIA_SELECTED', 'Panitia', $panitia->id, "Selected panitia: {$panitia->name}");

        return response()->json(['active_panitia' => ['id' => $panitia->id, 'name' => $panitia->name]]);
    }

    public function switchPanitia(Request $request)
    {
        $request->validate(['panitia_id' => 'required|integer']);

        $user = $request->user();
        $panitia = $user->panitia()
                        ->where('panitia.id', $request->panitia_id)
                        ->where('panitia.status', 'active')
                        ->first();

        if (!$panitia) {
            return response()->json(['message' => 'You do not have access to this Panitia.'], 403);
        }

        logAudit('PANITIA_SWITCHED', 'Panitia', $panitia->id, "Switched to panitia: {$panitia->name}");

        return response()->json(['active_panitia' => ['id' => $panitia->id, 'name' => $panitia->name]]);
    }

    public function myPanitia(Request $request)
    {
        $user = $request->user();
        $panitia = $user->panitia()
                        ->where('panitia.status', 'active')
                        ->select('panitia.id', 'panitia.name')
                        ->get();

        return response()->json($panitia);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        logAudit('LOGOUT', 'User', $user->id);
        $user->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
