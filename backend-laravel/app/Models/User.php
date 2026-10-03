<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'photo_path',
        'email',
        'password',
        'role',
        'is_active',
        'failed_attempts',
        'locked_until',
        'account_status',
        'approved_by',
        'approved_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'photo_path', // internal storage path; clients use has_photo + /users/{id}/photo
    ];

    /** Shared validation for profile photos (registration + settings). */
    public const PHOTO_RULES = 'file|image|mimes:jpg,jpeg,png,webp|max:2048|dimensions:max_width=6000,max_height=6000';

    protected $appends = ['has_photo'];

    protected function hasPhoto(): Attribute
    {
        return Attribute::get(fn () => !empty($this->photo_path));
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'failed_attempts' => 'integer',
            'locked_until' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function panitia(): BelongsToMany
    {
        return $this->belongsToMany(Panitia::class, 'user_panitia')
                    ->withPivot('is_primary')
                    ->withTimestamps();
    }

    public function primaryPanitia(): BelongsToMany
    {
        return $this->belongsToMany(Panitia::class, 'user_panitia')
                    ->withPivot('is_primary')
                    ->wherePivot('is_primary', true);
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'uploaded_by');
    }

    public function weeklyReports(): HasMany
    {
        return $this->hasMany(WeeklyReport::class, 'submitted_by');
    }
}
