<?php

use App\Models\AuditLog;

function logAudit(string $action, ?string $entityType = null, ?int $entityId = null, ?string $details = null): void
{
    $user = auth()->user();
    AuditLog::create([
        'user_id' => $user?->id,
        'action' => $action,
        'entity_type' => $entityType,
        'entity_id' => $entityId,
        'details' => $details,
        'ip_address' => request()->ip(),
        'user_agent' => request()->userAgent(),
    ]);
}
