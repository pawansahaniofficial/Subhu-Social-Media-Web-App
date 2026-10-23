<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Friendship;
use App\Models\Post;
use App\Models\PostReaction;
use App\Models\Comment;
use App\Models\Story;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['username' => 'subhu_team'],
            [
                'name' => 'Subhu Official',
                'full_name' => 'Subhu Official',
                'email' => 'team@subhu.social',
                'password' => Hash::make('AdminSubhu2026!'),
                'bio' => 'Official Subhu Engineering & Community Operations. Welcome to Subhu Social on Laravel & MySQL.',
                'avatar' => '/src/assets/images/subhu_brand_logo_1792752821003.jpg',
                'cover_photo' => '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
                'location' => 'Global / Decentralized',
                'website' => 'https://subhu.social',
                'is_verified' => true,
                'role' => 'admin',
                'status' => 'active',
                'two_factor_enabled' => true,
            ]
        );

        $sarah = User::firstOrCreate(
            ['username' => 'sarah_chen'],
            [
                'name' => 'Sarah Chen',
                'full_name' => 'Sarah Chen',
                'email' => 'sarah@subhu.social',
                'password' => Hash::make('Welcome123!'),
                'bio' => 'Software Architect & Distributed Systems Engineer. Building the future of human connection.',
                'avatar' => '/src/assets/images/avatar_subhu_founder_1792752821024.jpg',
                'cover_photo' => '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
                'location' => 'San Francisco, CA',
                'website' => 'https://sarahchen.io',
                'is_verified' => true,
                'role' => 'user',
                'status' => 'active',
                'two_factor_enabled' => false,
            ]
        );

        $maya = User::firstOrCreate(
            ['username' => 'maya_lin'],
            [
                'name' => 'Maya Lin',
                'full_name' => 'Maya Lin',
                'email' => 'maya@subhu.social',
                'password' => Hash::make('Welcome123!'),
                'bio' => 'Product Designer & Creative Technologist. Obsessed with micro-interactions and typographic rhythm.',
                'avatar' => '/src/assets/images/avatar_creative_user_1792752821026.jpg',
                'cover_photo' => '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
                'location' => 'Seattle, WA',
                'website' => 'https://mayadesigns.co',
                'is_verified' => true,
                'role' => 'user',
                'status' => 'active',
                'two_factor_enabled' => false,
            ]
        );

        $alex = User::firstOrCreate(
            ['username' => 'alex_rivera'],
            [
                'name' => 'Alex Rivera',
                'full_name' => 'Alex Rivera',
                'email' => 'alex@subhu.social',
                'password' => Hash::make('Welcome123!'),
                'bio' => 'Audio engineer, nature photographer, and open-source enthusiast.',
                'avatar' => '/src/assets/images/avatar_creative_user_1792752821026.jpg',
                'cover_photo' => '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
                'location' => 'Austin, TX',
                'website' => 'https://alexrivera.dev',
                'is_verified' => false,
                'role' => 'user',
                'status' => 'active',
                'two_factor_enabled' => false,
            ]
        );

        // Friendships
        Friendship::firstOrCreate(
            ['requester_id' => $sarah->id, 'addressee_id' => $maya->id],
            ['status' => 'accepted']
        );

        Friendship::firstOrCreate(
            ['requester_id' => $admin->id, 'addressee_id' => $sarah->id],
            ['status' => 'accepted']
        );

        Friendship::firstOrCreate(
            ['requester_id' => $alex->id, 'addressee_id' => $sarah->id],
            ['status' => 'pending']
        );

        // Sample Posts
        $p1 = Post::firstOrCreate(
            ['author_id' => $admin->id, 'content' => '✨ Welcome to Subhu! Engineered with a robust Laravel 11 + MySQL InnoDB architecture, versioned REST endpoints, strict server-side authorization policies, and real-time feeds.'],
            [
                'media_urls' => ['/src/assets/images/cover_landscape_aurora_1792752820966.jpg'],
                'audience' => 'public',
                'feeling' => 'celebrating',
                'location' => 'Subhu HQ',
                'is_pinned' => true,
            ]
        );

        $p2 = Post::firstOrCreate(
            ['author_id' => $sarah->id, 'content' => 'Our new Laravel backend is fully live on MySQL. Data integrity is enforced via InnoDB transactions, foreign keys, and Sanctum tokens. Privacy rules execute server-side!'],
            [
                'media_urls' => [],
                'audience' => 'public',
                'feeling' => 'excited',
                'location' => 'San Francisco, CA',
            ]
        );

        $p3 = Post::firstOrCreate(
            ['author_id' => $maya->id, 'content' => 'Friends-only post: Testing the centralized privacy engine. Only confirmed friends should be able to read this.'],
            [
                'media_urls' => [],
                'audience' => 'friends',
                'feeling' => 'inspired',
                'location' => 'Seattle, WA',
            ]
        );

        // Reactions
        PostReaction::firstOrCreate(
            ['post_id' => $p1->id, 'user_id' => $sarah->id],
            ['type' => 'love']
        );

        PostReaction::firstOrCreate(
            ['post_id' => $p1->id, 'user_id' => $maya->id],
            ['type' => 'like']
        );

        PostReaction::firstOrCreate(
            ['post_id' => $p2->id, 'user_id' => $maya->id],
            ['type' => 'love']
        );

        // Comments
        $c1 = Comment::firstOrCreate(
            ['post_id' => $p1->id, 'author_id' => $sarah->id, 'content' => 'Thrilled to see the real Laravel + MySQL foundation in production!'],
            ['parent_id' => null]
        );

        Comment::firstOrCreate(
            ['post_id' => $p1->id, 'author_id' => $maya->id, 'content' => '100% agreed Sarah! The architecture is pristine.'],
            ['parent_id' => $c1->id]
        );

        // Stories
        Story::firstOrCreate(
            ['author_id' => $sarah->id, 'caption' => 'Late night architecture session under the aurora sky 🌌'],
            [
                'media_url' => '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
                'media_type' => 'image',
                'viewers' => [['user_id' => $maya->id, 'viewed_at' => Carbon::now()->subMinutes(30)->toISOString()]],
                'expires_at' => Carbon::now()->addHours(24),
            ]
        );
    }
}
