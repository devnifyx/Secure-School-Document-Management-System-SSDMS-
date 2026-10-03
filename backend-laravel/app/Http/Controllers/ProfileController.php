<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user());
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'             => 'sometimes|string|max:255',
            'current_password' => 'required_with:new_password|string',
            'new_password'     => 'sometimes|string|min:8|confirmed',
        ]);

        if ($request->filled('new_password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Current password is incorrect.'],
                ]);
            }
            $user->update(['password' => Hash::make($request->new_password)]);
            logAudit('PROFILE_PASSWORD_CHANGED', 'User', $user->id, 'Password changed');
        }

        if ($request->filled('name')) {
            $user->update(['name' => $request->name]);
            logAudit('PROFILE_UPDATED', 'User', $user->id, 'Profile name updated');
        }

        return response()->json($user->fresh());
    }

    public function updatePhoto(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'photo' => 'required|' . User::PHOTO_RULES,
        ]);

        $newPath = $request->file('photo')->store('profile-photos', 'local');
        $oldPath = $user->photo_path;

        $user->update(['photo_path' => $newPath]);

        if ($oldPath) {
            Storage::disk('local')->delete($oldPath);
        }

        logAudit('PROFILE_PHOTO_CHANGED', 'User', $user->id, 'Profile photo updated');

        return response()->json($user->fresh());
    }

    public function removePhoto(Request $request)
    {
        $user = $request->user();

        if ($user->photo_path) {
            $oldPath = $user->photo_path;
            $user->update(['photo_path' => null]);
            Storage::disk('local')->delete($oldPath);
            logAudit('PROFILE_PHOTO_REMOVED', 'User', $user->id, 'Profile photo removed');
        }

        return response()->json($user->fresh());
    }
}
