<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeeklyReportAttachment extends Model
{
    protected $fillable = [
        'weekly_report_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'encrypted_key',
        'file_hash',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    public function weeklyReport(): BelongsTo
    {
        return $this->belongsTo(WeeklyReport::class);
    }
}
