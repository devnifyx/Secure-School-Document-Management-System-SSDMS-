<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Panitia;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class RegistrationController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'required|string|max:50|alpha_dash|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'primary_panitia_id' => 'required|exists:panitia,id',
        ]);

        $panitia = Panitia::where('id', $request->primary_panitia_id)
                          ->where('status', 'active')
                          ->firstOrFail();

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => 'Teacher',
            'is_active' => true,
            'account_status' => 'Pending',
        ]);

        $user->panitia()->attach($panitia->id, ['is_primary' => true]);

        $admins = User::where('role', 'Admin')->where('is_active', true)->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'message' => "New registration pending approval: {$user->name} ({$user->email})",
            ]);
        }

        logAudit('REGISTRATION_SUBMITTED', 'User', $user->id, "New teacher registration: {$user->name}", $user->id);

        return response()->json([
            'message' => 'Registration submitted successfully. Your account is pending administrator approval.',
        ], 201);
    }

    public function publicPanitiaList()
    {
        $panitia = Panitia::where('status', 'active')
                          ->select('id', 'name')
                          ->orderBy('name')
                          ->get();

        return response()->json($panitia);
    }
}
