<?php

namespace App\Http\Controllers;

use App\Models\Panitia;
use App\Models\User;
use Illuminate\Http\Request;

class PanitiaController extends Controller
{
    public function index()
    {
        $panitia = Panitia::withCount('users')->get();
        return response()->json($panitia);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:panitia',
        ]);

        $panitia = Panitia::create([
            'name' => $request->name,
            'status' => 'active',
        ]);

        logAudit('PANITIA_CREATED', 'Panitia', $panitia->id, "Created panitia: {$panitia->name}");

        return response()->json($panitia, 201);
    }

    public function show($id)
    {
        $panitia = Panitia::with(['users' => function ($q) {
            $q->select('users.id', 'users.name', 'users.email', 'users.role');
        }])->withCount('users', 'documents')->findOrFail($id);

        return response()->json($panitia);
    }

    public function update(Request $request, $id)
    {
        $panitia = Panitia::findOrFail($id);

        $request->validate([
            'name' => 'string|max:255|unique:panitia,name,' . $id,
            'status' => 'in:active,inactive',
        ]);

        $panitia->update($request->only(['name', 'status']));

        if ($request->status === 'inactive') {
            $affectedUsers = $panitia->users()->count();
            logAudit('PANITIA_DEACTIVATED', 'Panitia', $panitia->id,
                "Deactivated panitia: {$panitia->name} (affects {$affectedUsers} users)");
        } else {
            logAudit('PANITIA_UPDATED', 'Panitia', $panitia->id, "Updated panitia: {$panitia->name}");
        }

        return response()->json($panitia);
    }

    public function destroy($id)
    {
        $panitia = Panitia::findOrFail($id);
        $panitia->update(['status' => 'inactive']);

        logAudit('PANITIA_DEACTIVATED', 'Panitia', $panitia->id, "Deactivated panitia: {$panitia->name}");

        return response()->json(['message' => 'Panitia deactivated successfully.']);
    }

    public function members($id)
    {
        $panitia = Panitia::findOrFail($id);
        $members = $panitia->users()
                           ->select('users.id', 'users.name', 'users.email', 'users.role', 'users.is_active')
                           ->get();

        return response()->json($members);
    }

    public function assignUser(Request $request, $id)
    {
        $panitia = Panitia::findOrFail($id);

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'is_primary' => 'boolean',
        ]);

        $user = User::findOrFail($request->user_id);

        if ($panitia->users()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => 'User is already assigned to this Panitia.'], 422);
        }

        $isPrimary = $request->boolean('is_primary', false);

        if ($isPrimary) {
            $user->panitia()->updateExistingPivot(
                $user->panitia()->wherePivot('is_primary', true)->pluck('panitia.id')->toArray(),
                ['is_primary' => false]
            );
        }

        $panitia->users()->attach($user->id, ['is_primary' => $isPrimary]);

        logAudit('PANITIA_USER_ASSIGNED', 'Panitia', $panitia->id,
            "Assigned {$user->name} to panitia: {$panitia->name}" . ($isPrimary ? ' (primary)' : ''));

        return response()->json(['message' => 'User assigned successfully.']);
    }

    public function removeUser($id, $userId)
    {
        $panitia = Panitia::findOrFail($id);
        $user = User::findOrFail($userId);

        $wasPrimary = $panitia->users()
                              ->where('users.id', $userId)
                              ->wherePivot('is_primary', true)
                              ->exists();

        $panitia->users()->detach($userId);

        if ($wasPrimary) {
            $remaining = $user->panitia()->first();
            if ($remaining) {
                $user->panitia()->updateExistingPivot($remaining->id, ['is_primary' => true]);
            }
        }

        logAudit('PANITIA_USER_REMOVED', 'Panitia', $panitia->id,
            "Removed {$user->name} from panitia: {$panitia->name}");

        return response()->json(['message' => 'User removed from Panitia.']);
    }

    public function setPrimary($id, $userId)
    {
        $panitia = Panitia::findOrFail($id);
        $user = User::findOrFail($userId);

        if (!$panitia->users()->where('users.id', $userId)->exists()) {
            return response()->json(['message' => 'User is not assigned to this Panitia.'], 422);
        }

        $user->panitia()->updateExistingPivot(
            $user->panitia()->wherePivot('is_primary', true)->pluck('panitia.id')->toArray(),
            ['is_primary' => false]
        );

        $user->panitia()->updateExistingPivot($panitia->id, ['is_primary' => true]);

        logAudit('PANITIA_PRIMARY_CHANGED', 'Panitia', $panitia->id,
            "Set {$panitia->name} as primary panitia for {$user->name}");

        return response()->json(['message' => 'Primary Panitia updated.']);
    }
}
