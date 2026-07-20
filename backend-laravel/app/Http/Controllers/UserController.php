<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('panitia');

        if ($request->has('account_status')) {
            $query->where('account_status', $request->account_status);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'required|string|max:50|alpha_dash|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:Admin,Teacher',
            'panitia_ids' => 'array',
            'panitia_ids.*' => 'exists:panitia,id',
            'primary_panitia_id' => 'nullable|exists:panitia,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'is_active' => true,
            'account_status' => 'Approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        if ($request->panitia_ids) {
            foreach ($request->panitia_ids as $panitiaId) {
                $user->panitia()->attach($panitiaId, [
                    'is_primary' => $panitiaId == $request->primary_panitia_id,
                ]);
            }
        }

        logAudit('USER_CREATED', 'User', $user->id, "Created user: {$user->name} ({$user->role})");

        return response()->json($user->load('panitia'), 201);
    }

    public function show($id)
    {
        $user = User::with('panitia')->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'string|max:255',
            'email' => 'string|email|max:255|unique:users,email,' . $id,
            'username' => 'string|max:50|alpha_dash|unique:users,username,' . $id,
            'role' => 'in:Admin,Teacher',
            'is_active' => 'boolean',
            'panitia_ids' => 'array',
            'panitia_ids.*' => 'exists:panitia,id',
            'primary_panitia_id' => 'nullable|exists:panitia,id',
        ]);

        $user->update($request->only(['name', 'email', 'username', 'role', 'is_active']));

        if ($request->password) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        if ($request->has('is_active') && !$request->boolean('is_active')) {
            $user->tokens()->delete();
        }

        if ($request->has('panitia_ids')) {
            $syncData = [];
            foreach ($request->panitia_ids as $panitiaId) {
                $syncData[$panitiaId] = [
                    'is_primary' => $panitiaId == $request->primary_panitia_id,
                ];
            }
            $user->panitia()->sync($syncData);
        }

        logAudit('USER_UPDATED', 'User', $user->id, "Updated user: {$user->name}");

        return response()->json($user->load('panitia'));
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        logAudit('USER_DELETED', 'User', $user->id, "Deleted user: {$user->name}");
        $user->delete();
        return response()->json(null, 204);
    }

    public function approve($id)
    {
        $user = User::findOrFail($id);

        if ($user->account_status !== 'Pending') {
            return response()->json(['message' => 'This user is not pending approval.'], 422);
        }

        $user->update([
            'account_status' => 'Approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        Notification::create([
            'user_id' => $user->id,
            'message' => 'Your account has been approved! You can now log in to the system.',
        ]);

        logAudit('USER_APPROVED', 'User', $user->id, "Approved user: {$user->name}");

        return response()->json($user->load('panitia'));
    }

    public function reject(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->account_status !== 'Pending') {
            return response()->json(['message' => 'This user is not pending approval.'], 422);
        }

        $user->update(['account_status' => 'Rejected']);

        Notification::create([
            'user_id' => $user->id,
            'message' => 'Your registration has been rejected. Please contact an administrator for more information.',
        ]);

        logAudit('USER_REJECTED', 'User', $user->id, "Rejected user: {$user->name}");

        return response()->json($user->load('panitia'));
    }

    public function pendingRegistrations()
    {
        $users = User::with('panitia')
                      ->where('account_status', 'Pending')
                      ->orderBy('created_at', 'desc')
                      ->get();

        return response()->json($users);
    }
}
