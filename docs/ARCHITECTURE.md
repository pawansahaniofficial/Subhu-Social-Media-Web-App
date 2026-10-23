# Subhu Architecture Proposal & Database Design

## 1. High-Level Modular Monolith Architecture

Subhu uses a clean modular monolith architecture:

```
[ React 19 Frontend SPA ]
       | (REST /api/v1/* & WebSockets ws://)
       v
[ Express Server (server.ts) on Port 3000 ]
       |
       +---> [ Auth & Security Service ] (Tokens, Password Hashing, Policies)
       +---> [ Social Graph Service ] (Friendships, Follows, Blocks)
       +---> [ Feed & Content Engine ] (Posts, Audiences, Reactions, Comments)
       +---> [ Messaging & Realtime ] (Direct/Group Chats, WebSocket Dispatcher)
       +---> [ WebRTC Signaling Server ] (Offer/Answer/Candidate Coordination)
       +---> [ Stories Engine ] (24-Hour Expiration, View Tracking)
       +---> [ Moderation & Audit Engine ] (Reports, Triage, Action Log)
       |
       v
[ Transactional Persistent Store (src/server/db.ts) ]
       |
       v
[ Disk Storage (data/subhu_db.json with Atomic Writes) ]
```

## 2. Database Entities & Relationship Diagram

```
+------------------+         1:N          +------------------+
|      users       |--------------------->|      posts       |
|  - id (PK)       |                      |  - id (PK)       |
|  - username      |         1:N          |  - authorId (FK) |
|  - email         |--------------------->|  - content       |
|  - role          |                      |  - audience      |
|  - avatar        |                      |  - mediaUrls     |
+------------------+                      +------------------+
         |                                         |
         | 1:N                                     | 1:N
         v                                         v
+------------------+                      +------------------+
|   friendships    |                      |  post_reactions  |
|  - requesterId   |                      |  - postId (FK)   |
|  - addresseeId   |                      |  - userId (FK)   |
|  - status        |                      |  - type          |
+------------------+                      +------------------+
         |                                         |
         | 1:N                                     | 1:N
         v                                         v
+------------------+                      +------------------+
|  conversations   |                      |     comments     |
|  - id (PK)       |                      |  - id (PK)       |
|  - type          |                      |  - postId (FK)   |
+------------------+                      |  - authorId (FK) |
         |                                |  - parentId (FK) |
         | 1:N                            +------------------+
         v
+------------------+
|     messages     |
|  - id (PK)       |
|  - senderId (FK) |
|  - conversationId|
+------------------+
```

## 3. Privacy & Audience Engine

When queries are made to `/api/v1/posts`:
- `public`: visible to all active users.
- `friends`: visible only if `isFriend(authorId, viewerId)` or `authorId === viewerId`.
- `only_me`: visible only if `authorId === viewerId`.
- Content authored by users blocked by the viewer or who have blocked the viewer is strictly filtered out at query time.
