<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->after('id');
            $table->string('full_name')->after('name');
            $table->text('bio')->nullable()->after('full_name');
            $table->string('avatar')->nullable()->after('bio');
            $table->string('cover_photo')->nullable()->after('avatar');
            $table->string('location')->nullable()->after('cover_photo');
            $table->string('website')->nullable()->after('location');
            $table->boolean('is_verified')->default(false)->after('website');
            $table->enum('role', ['user', 'moderator', 'admin'])->default('user')->after('is_verified');
            $table->enum('status', ['active', 'deactivated', 'suspended'])->default('active')->after('role');
            $table->boolean('two_factor_enabled')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'username',
                'full_name',
                'bio',
                'avatar',
                'cover_photo',
                'location',
                'website',
                'is_verified',
                'role',
                'status',
                'two_factor_enabled',
            ]);
        });
    }
};
