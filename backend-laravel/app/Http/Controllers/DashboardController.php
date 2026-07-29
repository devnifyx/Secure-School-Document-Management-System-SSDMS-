<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Panitia;
use App\Models\User;
use App\Models\WeeklyReport;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();

        $currentWeek = now()->weekOfYear;

        if ($user->role === 'Admin') {
            $docQuery = Document::query();
            $wrQuery = WeeklyReport::query();
            if ($request->has('active_panitia_id')) {
                $docQuery->where('panitia_id', $request->input('active_panitia_id'));
                $wrQuery->where('panitia_id', $request->input('active_panitia_id'));
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
                'weekly_reports' => [
                    'total'    => (clone $wrQuery)->count(),
                    'pending'  => (clone $wrQuery)->where('status', 'Pending Review')->count(),
                    'approved' => (clone $wrQuery)->where('status', 'Approved')->count(),
                    'rejected' => (clone $wrQuery)->where('status', 'Rejected')->count(),
                    'late'     => (clone $wrQuery)->where('is_late', true)->count(),
                    'current_week' => $currentWeek,
                    'not_submitted_this_week' => User::where('role', 'Teacher')
                        ->where('is_active', true)
                        ->where('account_status', 'Approved')
                        ->whereDoesntHave('weeklyReports', fn ($q) => $q->where('week_number', $currentWeek))
                        ->count(),
                ],
                'recent_audit_logs' => AuditLog::with('user')
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get(),
            ]);
        }

        $panitiaId = $request->input('active_panitia_id');
        $docQuery = Document::where('panitia_id', $panitiaId);
        $myReportsQuery = WeeklyReport::where('submitted_by', $user->id);

        return response()->json([
            'documents' => [
                'total'    => (clone $docQuery)->count(),
                'pending'  => (clone $docQuery)->where('status', 'Pending')->count(),
                'approved' => (clone $docQuery)->where('status', 'Approved')->count(),
                'rejected' => (clone $docQuery)->where('status', 'Rejected')->count(),
            ],
            'weekly_reports' => [
                'total'    => (clone $myReportsQuery)->count(),
                'pending'  => (clone $myReportsQuery)->where('status', 'Pending Review')->count(),
                'approved' => (clone $myReportsQuery)->where('status', 'Approved')->count(),
                'rejected' => (clone $myReportsQuery)->where('status', 'Rejected')->count(),
                'current_week' => $currentWeek,
                'current_week_submitted' => (clone $myReportsQuery)->where('week_number', $currentWeek)->exists(),
                'submission_window_open' => now()->isSaturday() || now()->isSunday(),
            ],
        ]);
    }
}
