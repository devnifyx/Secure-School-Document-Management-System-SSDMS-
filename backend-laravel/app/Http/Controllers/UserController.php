<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $users = User::all();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:Admin,Teacher',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'is_active' => true,
        ]);

        logAudit('USER_CREATED', 'User', $user->id, "Created user: {$user->name} ({$user->role})");

        return response()->json($user, 201);
    }

    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'string|max:255',
            'email' => 'string|email|max:255|unique:users,email,' . $id,
            'role' => 'in:Admin,Teacher',
            'is_active' => 'boolean',
        ]);

        $user->update($request->only(['name', 'email', 'role', 'is_active']));

        if ($request->password) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        // Immediately revoke all tokens when account is deactivated
        if ($request->has('is_active') && !$request->boolean('is_active')) {
            $user->tokens()->delete();
        }

        logAudit('USER_UPDATED', 'User', $user->id, "Updated user: {$user->name}");

        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        logAudit('USER_DELETED', 'User', $user->id, "Deleted user: {$user->name}");
        $user->delete();
        return response()->json(null, 204);
    }
}
