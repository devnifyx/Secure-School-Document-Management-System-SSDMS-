<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Panitia;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'Admin') {
            $docQuery = Document::query();
            if ($request->has('active_panitia_id')) {
                $docQuery->where('panitia_id', $request->input('active_panitia_id'));
            }

            return response()->json([
                'documents' => [
                    'total'    => (clone $docQuery)->count(),
                    'pending'  => (clone $docQuery)->where('status', 'Pending')->count(),
                    'approved' => (clone $docQuery)->where('status', 'Approved')->count(),
                    'rejected' => (clone $docQuery)->where('status', 'Rejected')->count(),
                ],
                'users' => [
                    'total'  => User::count(),
                    'active' => User::where('is_active', true)->where('account_status', 'Approved')->count(),
                ],
                'pending_registrations' => User::where('account_status', 'Pending')->count(),
                'panitia' => [
                    'total'  => Panitia::count(),
                    'active' => Panitia::where('status', 'active')->count(),
                ],
                'recent_audit_logs' => AuditLog::with('user')
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get(),
            ]);
        }

        $panitiaId = $request->input('active_panitia_id');
        $docQuery = Document::where('panitia_id', $panitiaId);

        return response()->json([
            'documents' => [
                'total'    => (clone $docQuery)->count(),
                'pending'  => (clone $docQuery)->where('status', 'Pending')->count(),
                'approved' => (clone $docQuery)->where('status', 'Approved')->count(),
                'rejected' => (clone $docQuery)->where('status', 'Rejected')->count(),
            ],
        ]);
    }
}
