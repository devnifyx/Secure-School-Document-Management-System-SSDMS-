<?php

use App\Models\AuditLog;

function logAudit(string $action, ?string $entityType = null, ?int $entityId = null, ?string $details = null, ?int $actorId = null): void
{
    $userId = $actorId ?? auth()->id();
    AuditLog::create([
        'user_id' => $userId,
        'action' => $action,
        'entity_type' => $entityType,
        'entity_id' => $entityId,
        'details' => $details,
        'ip_address' => request()->ip(),
        'user_agent' => request()->userAgent(),
    ]);
}
