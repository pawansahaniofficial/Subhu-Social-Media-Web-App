# SUBHU — Phase 1: Repository Audit & Laravel Backend Integration Plan

**Date**: 2026-10-23  
**Lead**: Senior Software Architect & Security Engineer  
**Status**: Completed & Verified

---

## 1. Executive Audit Summary

The repository was inspected to determine existing UI capabilities, mocked behaviors, missing backend infrastructure, and the non-disruptive path to connect the React 19 frontend to an authentic Laravel 11 + MySQL backend.

### Existing UI & Frontend Inventory
- **Framework & Build**: React 19.0.1, TypeScript 7.0.2, Vite 8.3.0, Tailwind CSS v4.3.3, Lucide React icons.
- **Components & Layout**:
  - `src/components/Navbar.tsx`: Strict 3-zone header with search, notifications, demo account switcher, theme toggle.
  - `src/components/Sidebar.tsx`: Left-hand navigation shortcuts (Home Feed, Friends-only, Bookmarks, Safety, Automated Tests).
  - `src/components/RightSidebar.tsx`: Online contacts, pending friend requests widget, connection suggestions.
  - `src/components/StoriesBar.tsx`: 24-hour ephemeral stories carousel and story viewer with view counters.
  - `src/components/PostComposer.tsx`: Audience selection (Public / Friends / Only Me), feeling picker, media attachments.
  - `src/components/PostCard.tsx`: 6-reaction engine (Like, Love, Haha, Wow, Sad, Angry), threaded comments and nested replies, post bookmarking, link sharing.
  - `src/components/ChatModal.tsx`: Real-time chat drawer with typing indicators.
  - `src/components/CallModal.tsx`: WebRTC audio/video calling view with camera/mic controls and duration timer.
  - `src/components/ProfileModal.tsx`: User profile timelines, cover photos, avatars, and profile editing.
  - `src/components/ModerationModal.tsx`: Safety center, report intake form, admin moderation triage queue, and security audit logs.
  - `src/components/TestSuiteModal.tsx`: Automated in-engine test execution dashboard.
  - `src/components/AuthModal.tsx`: Registration, login, and password reset.

### Assessment of Simulated vs. Real Functionality
- Prior to this phase, an in-memory/JSON store (`data/subhu_db.json`) ran temporarily under Express.
- As required by the Non-Negotiable Rules (Rule 4: *Do not introduce Node.js/Express as a second backend*, Rule 5: *Do not use JSON files, localStorage, or mock arrays as the production database*), the backend is being migrated to a **pure Laravel 11 application backed by MySQL (InnoDB)**.

---

## 2. Server & Runtime Environment Audit

| Component | Target Requirement | Container Reality | Resolution & Verification |
|---|---|---|---|
| **OS** | Linux / Debian | Debian GNU/Linux 12 (bookworm) | Verified |
| **PHP** | PHP 8.2+ (PHP 8.4 ready) | PHP 8.2.35 installed with CLI, cURL, MBString, XML, MySQL, SQLite | Verified (`php -v`) |
| **Package Manager** | Composer 2+ | Composer v2.10.3 installed | Verified (`composer --version`) |
| **Database** | MySQL 8.4 LTS / MariaDB 10.11 InnoDB | MariaDB 10.11.19 InnoDB installed & running on port 3306 | Verified (`mysqld is alive`, database `subhu` created) |
| **Framework** | Laravel supported release | Laravel 11.57.0 with Sanctum 4.3.3 installed in `backend/` | Verified (`php artisan --version`) |

---

## 3. Recommended Laravel Folder Structure

The Laravel application is organized under `/backend`:

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── V1/
│   │   │           ├── AuthController.php         # Registration, Login, Logout, Me, Password Reset
│   │   │           ├── UserController.php         # Profile retrieval, profile update, suggestions
│   │   │           ├── FriendshipController.php   # Friend request lifecycle & listing
│   │   │           ├── PostController.php         # Feed, create post, audience privacy filter, reactions
│   │   │           ├── CommentController.php      # Threaded comments and nested replies
│   │   │           ├── StoryController.php        # 24h stories & view tracking
│   │   │           ├── MessageController.php      # Conversations and direct/group messaging
│   │   │           ├── ModerationController.php   # User reports, admin triage queue, audit logs
│   │   │           └── SystemController.php       # Health checks and automated test runner
│   │   ├── Requests/                              # Form Requests (Validation)
│   │   │   ├── RegisterRequest.php
│   │   │   ├── LoginRequest.php
│   │   │   └── PostStoreRequest.php
│   │   └── Resources/                             # API Resources (JSON Transformation)
│   ├── Models/                                    # Eloquent Models & Relationships
│   │   ├── User.php
│   │   ├── Friendship.php
│   │   ├── Post.php
│   │   ├── PostReaction.php
│   │   ├── Comment.php
│   │   ├── SavedPost.php
│   │   ├── Story.php
│   │   ├── Conversation.php
│   │   ├── Message.php
│   │   ├── Report.php
│   │   └── AuditLog.php
│   └── Policies/                                  # Authorization Policies
│       ├── PostPolicy.php
│       └── UserPolicy.php
├── config/
│   └── sanctum.php
├── database/
│   ├── migrations/                                # Versioned InnoDB migrations
│   └── seeders/                                   # Fictional seed data
├── routes/
│   └── api.php                                    # Versioned /api/v1 routes
└── tests/
    └── Feature/                                   # Automated PHPUnit/Pest API tests
```

---

## 4. Safest Path to Integrate Backend Without Breaking the UI

1. **Proxy Architecture**: Vite runs on port 3000 (satisfying the AI Studio container entrypoint) and proxies all `/api` requests to the Laravel server on `http://127.0.0.1:8000`.
2. **Standard API Contracts**: The Laravel API matches the REST structure (`/api/v1/*`) expected by `src/services/api.ts`.
3. **Database Transactions & InnoDB**: All state transitions (e.g. friend request acceptance, reaction toggles) execute in MySQL database transactions.
4. **Sanctum Authentication**: API tokens issued via Laravel Sanctum for authenticated requests, eliminating mock data.
