<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    protected $fillable = [
        'author_id',
        'content',
        'media_urls',
        'audience',
        'feeling',
        'location',
        'is_pinned',
        'is_edited',
        'is_deleted',
    ];

    protected $casts = [
        'media_urls' => 'array',
        'is_pinned' => 'boolean',
        'is_edited' => 'boolean',
        'is_deleted' => 'boolean',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(PostReaction::class, 'post_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'post_id');
    }

    public function savedBy(): HasMany
    {
        return $this->hasMany(SavedPost::class, 'post_id');
    }
}
