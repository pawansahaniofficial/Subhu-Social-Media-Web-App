<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'full_name',
        'email',
        'password',
        'bio',
        'avatar',
        'cover_photo',
        'location',
        'website',
        'is_verified',
        'role',
        'status',
        'two_factor_enabled',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_verified' => 'boolean',
            'two_factor_enabled' => 'boolean',
        ];
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'author_id');
    }

    public function friendshipsRequested(): HasMany
    {
        return $this->hasMany(Friendship::class, 'requester_id');
    }

    public function friendshipsReceived(): HasMany
    {
        return $this->hasMany(Friendship::class, 'addressee_id');
    }

    public function isFriendsWith(int|string $otherId): bool
    {
        if ((string)$this->id === (string)$otherId) {
            return true;
        }

        return Friendship::where(function ($q) use ($otherId) {
            $q->where('requester_id', $this->id)->where('addressee_id', $otherId);
        })->orWhere(function ($q) use ($otherId) {
            $q->where('requester_id', $otherId)->where('addressee_id', $this->id);
        })->where('status', 'accepted')->exists();
    }

    public function isBlockedWith(int|string $otherId): bool
    {
        return Friendship::where(function ($q) use ($otherId) {
            $q->where('requester_id', $this->id)->where('addressee_id', $otherId);
        })->orWhere(function ($q) use ($otherId) {
            $q->where('requester_id', $otherId)->where('addressee_id', $this->id);
        })->where('status', 'blocked')->exists();
    }
}
