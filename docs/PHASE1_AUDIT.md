# SUBHU Phase 1 Audit (2026-10-23)

## Verification status
Only `php -l` syntax checks were run. NOT verified (blocked): Composer install, `artisan`, migrations, MySQL connection, `npm install`, `vite build`, `tsc`.
Blockers: sandbox cannot reach Packagist, npm registry, apt or MySQL repos; `backend/vendor/` in the zip is incomplete (no `symfony/*`), so `php artisan` fails; PHP here is 8.3.6 (target 8.4); no MySQL server installed.

## Architecture found
- Frontend: React 19 / Vite / Tailwind 4 (src/). Calls `/api/v1` with a Bearer token kept in localStorage.
- Legacy backend: Express + `ws` + `data/subhu_db.json` (src/server, server.ts). Fully implements the API the UI uses.
- Laravel 11 (backend/): scaffold only. 11 models, 12 migrations, a seeder. NO controllers, policies, form requests or API routes (only `/user`) before this change.

## Functional vs incomplete
- Working (legacy Express only): auth, posts, friends, messages, stories, calls signalling, notifications, moderation, search.
- Laravel: none of the above is exposed. Every UI feature is currently disconnected from Laravel.

## Critical issues
1. `backend/.env` was committed in the zip (DB/Redis/AWS keys). Removed from this working copy; treat any real values as leaked and rotate.
2. `App.tsx` auto-logs in as `sarah_chen` / `Welcome123!` -> now gated to dev + `VITE_ENABLE_DEMO_LOGIN=true`.
3. `User::isFriendsWith/isBlockedWith`: `->orWhere(...)->where('status', ...)` precedence bug; pending/declined rows can count as friends. Not yet fixed (Phase 3).
4. Seeder uses known passwords and an admin account; must be restricted to local/testing.
5. Blocks are stored as a `friendships.status` and `unique(requester,addressee)` cannot represent both directions; a dedicated `blocks` table is planned.
6. Posts use JSON `media_urls` and boolean `is_deleted` instead of `post_media`/soft deletes; `role` and `status` are `$fillable` on User (mass-assignment risk; fix in Phase 2).
7. Frontend stores Bearer token in localStorage; Sanctum SPA cookie auth is the recommended choice (Phase 2).
8. Express: 15 MB JSON limit, no rate limiting, PBKDF2 hashes in data/subhu_db.json (demo data).
9. Docs (`docs/*.md`) claim PHP 8.2/MariaDB/Laravel controllers "Verified"; none of that matched the repo or this environment. They are stale.
10. `@google/genai`, `GEMINI_API_KEY` and `metadata.json` are unused leftovers of AI Studio.

## Config gaps
Laravel 11 (no longer a current release), `composer.json` allows PHP ^8.2; `.env.example` defaulted to sqlite; no CORS config; `statefulApi()` not enabled; no health endpoint.

## Phase 1 changes made
- backend/.env.example: MySQL, SPA/Sanctum, FRONTEND_URL, secure cookie vars.
- backend/config/cors.php (credentials on, origin allowlist); `statefulApi()` in bootstrap/app.php.
- `GET /api/v1/health` (DB check, no error detail leaked); `GET /api/v1/auth/me` (auth:sanctum).
- vite.config.ts proxies `/api` and `/sanctum` to Laravel; `npm run dev` now runs Vite only; Express kept as `dev:legacy-express` (not a production path).
- Root `.env.example` replaced (no Gemini).

## Remaining Phase 1 steps (need a networked machine)
1. `cd backend && composer install` (PHP 8.4); decide Laravel 11 -> 12/13 after `composer why-not`.
2. Create MySQL 8.4 DB + `subhu_app` user; `cp .env.example .env`; `php artisan key:generate`; `php artisan migrate`.
3. `php artisan serve`, then `curl localhost:8000/api/v1/health` -> expect 200.
4. `npm install && npm run dev`; confirm `curl localhost:3000/api/v1/health` through the proxy.
5. Once Laravel serves the API (Phases 2-4), delete `server.ts`, `src/server/`, `data/`.
