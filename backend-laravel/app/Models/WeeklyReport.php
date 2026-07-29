<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WeeklyReport extends Model
{
    protected $fillable = [
        'submitted_by',
        'panitia_id',
        'title',
        'week_number',
        'period_start',
        'period_end',
        'activity_summary',
        'challenges',
        'actions_taken',
        'next_week_plan',
        'status',
        'is_late',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'week_number' => 'integer',
            'period_start' => 'date',
            'period_end' => 'date',
            'is_late' => 'boolean',
        ];
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function panitia(): BelongsTo
    {
        return $this->belongsTo(Panitia::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(WeeklyReportAttachment::class);
    }
}
