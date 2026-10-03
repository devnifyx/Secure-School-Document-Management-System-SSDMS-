<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = $this->filteredQuery($request)->paginate(20);

        return response()->json($logs);
    }

    public function export(Request $request)
    {
        $stream = fopen('php://temp', 'r+');
        fputcsv($stream, ['ID', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP Address', 'Timestamp']);

        foreach ($this->filteredQuery($request)->cursor() as $log) {
            fputcsv($stream, array_map([$this, 'csvSafe'], [
                $log->id,
                $log->user?->name ?? 'System',
                $log->action,
                $log->entity_type,
                $log->entity_id,
                $log->details,
                $log->ip_address,
                $log->created_at,
            ]));
        }

        rewind($stream);
        $csv = stream_get_contents($stream);
        fclose($stream);

        logAudit('AUDIT_LOG_EXPORTED', null, null, 'Audit logs exported to CSV');

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="audit-logs-' . now()->format('Y-m-d') . '.csv"',
        ]);
    }

    private function filteredQuery(Request $request)
    {
        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        return $query;
    }

    // stop spreadsheets from running user-supplied text that starts with = + - @ as a formula
    private function csvSafe($value)
    {
        return is_string($value) && preg_match('/^[=+\-@]/', $value) ? "'" . $value : $value;
    }
}
