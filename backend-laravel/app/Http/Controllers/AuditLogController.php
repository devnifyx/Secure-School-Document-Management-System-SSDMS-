<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('action') && $request->action) {
            $query->where('action', 'like', '%' . $request->action . '%');
        }

        $logs = $query->paginate(20);
        return response()->json($logs);
    }

    public function export(Request $request)
    {
        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('action') && $request->action) {
            $query->where('action', 'like', '%' . $request->action . '%');
        }

        $logs = $query->get();

        $csv = "ID,User,Action,\"Entity Type\",\"Entity ID\",Details,\"IP Address\",Timestamp\n";
        foreach ($logs as $log) {
            $csv .= implode(',', [
                $log->id,
                '"' . ($log->user?->name ?? 'System') . '"',
                '"' . $log->action . '"',
                '"' . ($log->entity_type ?? '') . '"',
                $log->entity_id ?? '',
                '"' . str_replace('"', '""', $log->details ?? '') . '"',
                '"' . ($log->ip_address ?? '') . '"',
                '"' . $log->created_at . '"',
            ]) . "\n";
        }

        logAudit('AUDIT_LOG_EXPORTED', null, null, 'Audit logs exported to CSV');

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="audit-logs-' . now()->format('Y-m-d') . '.csv"',
        ]);
    }
}
