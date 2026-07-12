<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'Admin') {
            return response()->json([
                'documents' => [
                    'total'    => Document::count(),
                    'pending'  => Document::where('status', 'Pending')->count(),
                    'approved' => Document::where('status', 'Approved')->count(),
                    'rejected' => Document::where('status', 'Rejected')->count(),
                ],
                'users' => [
                    'total'  => User::count(),
                    'active' => User::where('is_active', true)->count(),
                ],
                'recent_audit_logs' => AuditLog::with('user')
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get(),
            ]);
        }

        return response()->json([
            'documents' => [
                'total'    => Document::where('uploaded_by', $user->id)->count(),
                'pending'  => Document::where('uploaded_by', $user->id)->where('status', 'Pending')->count(),
                'approved' => Document::where('uploaded_by', $user->id)->where('status', 'Approved')->count(),
                'rejected' => Document::where('uploaded_by', $user->id)->where('status', 'Rejected')->count(),
            ],
        ]);
    }
}
