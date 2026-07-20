<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Document extends Model
{
    protected $fillable = [
        'title',
        'description',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'category',
        'tags',
        'uploaded_by',
        'status',
        'rejection_reason',
        'encrypted_key',
        'file_hash',
        'panitia_id',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'tags' => 'array',
        ];
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function panitia(): BelongsTo
    {
        return $this->belongsTo(Panitia::class);
    }
}
