<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserPhotoController extends Controller
{
    /**
     * Stream a user's profile photo. Photos live on the private disk, so only the
     * owner and Administrators may fetch them.
     */
    public function show(Request $request, User $user)
    {
        $viewer = $request->user();

        if ($viewer->role !== 'Admin' && $viewer->id !== $user->id) {
            abort(403, 'You do not have access to this photo.');
        }

        $disk = Storage::disk('local');

        if (empty($user->photo_path) || !$disk->exists($user->photo_path)) {
            abort(404, 'No photo available.');
        }

        return $disk->response($user->photo_path, null, [
            'Cache-Control' => 'private, max-age=300',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
