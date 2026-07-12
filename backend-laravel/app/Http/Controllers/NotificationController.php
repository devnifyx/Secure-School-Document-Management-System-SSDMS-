<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        return response()->json($notifications);
    }

    public function markAsRead($id)
    {
        $user = request()->user();
        $notification = Notification::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $notification->update(['is_read' => true]);
        return response()->json($notification);
    }

    public function markAllAsRead()
    {
        $user = request()->user();
        Notification::where('user_id', $user->id)->update(['is_read' => true]);
        return response()->json(['message' => 'All notifications marked as read']);
    }
}
