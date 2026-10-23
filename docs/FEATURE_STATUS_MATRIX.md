# Subhu Feature Status Matrix

| Module | Feature | Status | Verification & Test Evidence |
|---|---|---|---|
| **Auth** | User Registration & Validation | Implemented & Tested | Automated tests verify unique email/username, password hash |
| **Auth** | Secure Login & Password Hashing | Implemented & Tested | Salted PBKDF2, session token generation |
| **Auth** | Session Management & Logout | Implemented & Tested | Revocation on logout and device management |
| **Auth** | Password Recovery Workflow | Implemented & Tested | Reset code verification and password update |
| **Profile** | User Profiles, Avatars & Covers | Implemented & Tested | Profile timeline, bio, cover photo, privacy controls |
| **Social Graph**| Friend Requests & Confirmation | Implemented & Tested | State machine (pending -> accepted/declined) |
| **Social Graph**| Friend Removal & Follows | Implemented & Tested | Follow counters, friendship list pagination |
| **Social Graph**| User Blocking & Safety Filter | Implemented & Tested | Bi-directional feed & message restriction |
| **Posts** | Rich Post Composer (Media/Privacy) | Implemented & Tested | Public/Friends/Only Me privacy enforcement |
| **Posts** | Reactions (6 Types: Like/Love/etc) | Implemented & Tested | Duplicate reaction prevention & toggling |
| **Posts** | Threaded Comments & Replies | Implemented & Tested | Nested replies with author metadata |
| **Posts** | Post Bookmarking & Saved Posts | Implemented & Tested | Dedicated collections and save/unsave actions |
| **Stories** | 24-Hour Ephemeral Stories | Implemented & Tested | Expiration calculation, viewer tracking |
| **Messaging** | Direct & Group Conversations | Implemented & Tested | Membership validation, message history |
| **Messaging** | Real-time WebSocket Messaging | Implemented & Tested | Live event distribution & typing indicators |
| **Calling** | WebRTC Audio/Video Call Signaling | Implemented & Tested | Offer/Answer/ICE candidate signaling, call modal |
| **Notifications**| In-App Notification Center | Implemented & Tested | Real-time alerts, mark read, unread counts |
| **Search** | Global Unified Search | Implemented & Tested | Searches users, posts, hashtags, and communities |
| **Moderation** | Report Intake & Case Assignment | Implemented & Tested | Admin moderation queue and audit logging |
| **Admin** | Moderation Dashboard & Health | Implemented & Tested | Content removal, suspension, system stats |
| **Testing** | In-Engine Automated Test Suite | Implemented & Tested | 35+ automated validation assertions |
