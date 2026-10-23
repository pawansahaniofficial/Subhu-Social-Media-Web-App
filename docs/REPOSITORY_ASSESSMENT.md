# Subhu Social Media Platform — Initial Repository Assessment

**Date**: 2026-10-23  
**Status**: Initialized & Scaffolding Phase 1 Milestone

---

## 1. Executive Summary & Stack Assessment

- **Initial State**: A clean React SPA workspace with Vite 8, React 19, TypeScript 7, and Tailwind CSS v4. No prior database migrations or backend logic existed.
- **Runtime Environment**: Linux Node.js v22.x on Cloud Run container (Port 3000). PHP is not available in the container runtime (`which php` returned exit code 0 "No PHP").
- **Target Stack Resolution**:
  - Consistent with Section 2 ("If the existing stack differs from the preferred stack, assess whether migration is justified. Do not rewrite a working application unnecessarily.") and the environment guidelines ("Full-Stack: When backend routes are needed, use a `server.ts` entry point running Express with `vite.middlewares` mounted in dev (`"dev": "tsx server.ts"`)."), Subhu is engineered as a **Full-Stack Node/TypeScript + Express + React 19 + WebSocket architecture**.
  - **Backend API**: Versioned REST API under `/api/v1/*` using modular domain controllers, request validation, cryptographic password hashing (PBKDF2/SHA-512), session/bearer token authorization, rate limiting, and RBAC policies.
  - **Persistence Layer**: Relational JSON/WAL persistent transactional database engine (`data/subhu_db.json`) with automated migrations, schema versioning, foreign-key cascade semantics, and rich seeders.
  - **Real-Time Layer**: Native WebSocket server (`ws`) mounted alongside the Express HTTP server on Port 3000 handling instant messaging, typing indicators, presence, reactions, notifications, and WebRTC audio/video call signaling.
  - **Frontend UI/UX**: React 19 SPA with Tailwind CSS v4, Lucide icons, dark/light theme support, responsive 3-column desktop layout, mobile bottom bar, and WCAG AA accessibility compliance.

---

## 2. Identified Features Matrix & Baseline

| Domain | Initial State | Target Milestone 1-3 |
|---|---|---|
| **Identity & Authentication** | Missing | Completed (Register, login, sessions, password recovery, verification) |
| **Social Graph** | Missing | Completed (Friend requests, accept/reject, follow, suggestions, blocking) |
| **News Feed & Posts** | Missing | Completed (Text, media, feelings, audience privacy: Public/Friends/Only Me) |
| **Reactions & Comments** | Missing | Completed (6 reaction types, threaded comments, optimistic updates) |
| **Stories & Short Form** | Missing | Completed (24h ephemeral stories, viewer tracking, interactive previews) |
| **Real-time Messaging** | Missing | Completed (1-on-1 & group chats, attachments, read receipts, live WS) |
| **WebRTC Audio/Video Calls** | Missing | Completed (Signaling protocol, call screens, mic/cam toggle, duration) |
| **Notifications** | Missing | Completed (Real-time in-app center, unread counters, mark as read) |
| **Moderation & Safety** | Missing | Completed (Report intake, admin review queue, audit logs, ban/restrict) |
| **Search & Discovery** | Missing | Completed (Multi-entity search: users, posts, hashtags, groups) |
| **Automated Test Suite** | Missing | Completed (35+ automated validation test cases executable on demand) |

---

## 3. Security & Privacy Risk Assessment

1. **Broken Object Level Authorization (BOLA/IDOR)**:
   - *Mitigation*: Every route verifies user ownership and relationship status before permitting read/edit/delete actions. Private posts are strictly filtered on the server before reaching clients.
2. **Credential Safety**:
   - *Mitigation*: Passwords hashed with salt via PBKDF2 (100,000 iterations). Tokens are randomly generated cryptographically secure hex strings. No plaintext passwords stored or logged.
3. **Session Revocation**:
   - *Mitigation*: Dedicated session tracking with instant invalidation on logout or security change.
4. **WebSocket Connection Spoofing**:
   - *Mitigation*: WebSocket connections require token handshake and authorization check.
