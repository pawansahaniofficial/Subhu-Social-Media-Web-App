<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->text('content')->nullable();
            $table->json('media_urls')->nullable();
            $table->enum('audience', ['public', 'friends', 'only_me'])->default('public');
            $table->string('feeling')->nullable();
            $table->string('location')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_edited')->default(false);
            $table->boolean('is_deleted')->default(false);
            $table->timestamps();

            $table->index(['author_id', 'audience']);
            $table->index(['created_at', 'is_deleted']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
