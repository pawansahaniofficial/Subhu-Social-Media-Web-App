import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  bio: string;
  avatar: string;
  coverPhoto: string;
  location?: string;
  website?: string;
  isVerified: boolean;
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'deactivated' | 'suspended';
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  lastActiveAt: string;
  revokedAt?: string;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export type Audience = 'public' | 'friends' | 'only_me';

export interface Post {
  id: string;
  authorId: string;
  content: string;
  mediaUrls: string[];
  audience: Audience;
  feeling?: string;
  location?: string;
  isPinned?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostReaction {
  id: string;
  postId: string;
  userId: string;
  type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId?: string | null;
  content: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedPost {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  viewers: { userId: string; viewedAt: string }[];
  expiresAt: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  creatorId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: string[];
  replyToId?: string;
  readBy: { userId: string; readAt: string }[];
  isDeleted?: boolean;
  createdAt: string;
}

export interface CallSession {
  id: string;
  callerId: string;
  calleeId: string;
  conversationId?: string;
  type: 'audio' | 'video';
  status: 'initiating' | 'ringing' | 'connected' | 'ended' | 'declined' | 'missed';
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type: 'friend_request' | 'friend_accept' | 'post_reaction' | 'post_comment' | 'comment_reply' | 'call_missed' | 'mention' | 'system_alert';
  entityId: string;
  entityType: 'post' | 'user' | 'comment' | 'call' | 'conversation';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'post' | 'user' | 'comment' | 'message';
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  moderatorNotes?: string;
  moderatorId?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  privacy: 'public' | 'private';
  creatorId: string;
  memberIds: string[];
  createdAt: string;
}

interface DatabaseSchema {
  version: number;
  users: User[];
  sessions: UserSession[];
  friendships: Friendship[];
  follows: Follow[];
  posts: Post[];
  reactions: PostReaction[];
  comments: Comment[];
  savedPosts: SavedPost[];
  stories: Story[];
  conversations: Conversation[];
  messages: Message[];
  calls: CallSession[];
  notifications: Notification[];
  reports: Report[];
  auditLogs: AuditLog[];
  groups: Group[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'subhu_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class SubhuDatabase {
  private static instance: SubhuDatabase;
  private data: DatabaseSchema;

  private constructor() {
    this.data = this.loadOrInitialize();
  }

  public static getInstance(): SubhuDatabase {
    if (!SubhuDatabase.instance) {
      SubhuDatabase.instance = new SubhuDatabase();
    }
    return SubhuDatabase.instance;
  }

  private loadOrInitialize(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to read db file, initializing fresh:', err);
      }
    }
    const fresh = this.getInitialSeedData();
    this.saveDataDirect(fresh);
    return fresh;
  }

  private saveDataDirect(data: DatabaseSchema): void {
    const tmp = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_FILE);
  }

  public persist(): void {
    this.saveDataDirect(this.data);
  }

  // --- Password Hashing with PBKDF2 ---
  public static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const activeSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, activeSalt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt: activeSalt };
  }

  public static verifyPassword(password: string, hash: string, salt: string): boolean {
    const calculated = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculated, 'hex'));
  }

  // --- Seed Data ---
  private getInitialSeedData(): DatabaseSchema {
    const adminPass = SubhuDatabase.hashPassword('AdminSubhu2026!');
    const userPass = SubhuDatabase.hashPassword('Welcome123!');

    const now = new Date().toISOString();
    const oneDayAhead = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const users: User[] = [
      {
        id: 'usr_admin',
        username: 'subhu_team',
        email: 'team@subhu.social',
        passwordHash: adminPass.hash,
        salt: adminPass.salt,
        fullName: 'Subhu Official',
        bio: 'Official Subhu Engineering & Community Operations. Welcome to Subhu Social.',
        avatar: '/src/assets/images/subhu_brand_logo_1792752821003.jpg',
        coverPhoto: '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
        location: 'Global / Decentralized',
        website: 'https://subhu.social',
        isVerified: true,
        role: 'admin',
        status: 'active',
        twoFactorEnabled: true,
        createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'usr_sarah',
        username: 'sarah_chen',
        email: 'sarah@subhu.social',
        passwordHash: userPass.hash,
        salt: userPass.salt,
        fullName: 'Sarah Chen',
        bio: 'Software Architect & Distributed Systems Engineer. Building the future of human connection.',
        avatar: '/src/assets/images/avatar_subhu_founder_1792752821024.jpg',
        coverPhoto: '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
        location: 'San Francisco, CA',
        website: 'https://sarahchen.io',
        isVerified: true,
        role: 'user',
        status: 'active',
        twoFactorEnabled: false,
        createdAt: new Date(Date.now() - 20 * 24 * 3600000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'usr_maya',
        username: 'maya_lin',
        email: 'maya@subhu.social',
        passwordHash: userPass.hash,
        salt: userPass.salt,
        fullName: 'Maya Lin',
        bio: 'Product Designer & Creative Technologist. Obsessed with micro-interactions and typographic rhythm.',
        avatar: '/src/assets/images/avatar_creative_user_1792752821026.jpg',
        coverPhoto: '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
        location: 'Seattle, WA',
        website: 'https://mayadesigns.co',
        isVerified: true,
        role: 'user',
        status: 'active',
        twoFactorEnabled: false,
        createdAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'usr_alex',
        username: 'alex_rivera',
        email: 'alex@subhu.social',
        passwordHash: userPass.hash,
        salt: userPass.salt,
        fullName: 'Alex Rivera',
        bio: 'Audio engineer, nature photographer, and open-source enthusiast.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        coverPhoto: '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
        location: 'Austin, TX',
        website: 'https://alexrivera.dev',
        isVerified: false,
        role: 'user',
        status: 'active',
        twoFactorEnabled: false,
        createdAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
        updatedAt: now,
      },
    ];

    const friendships: Friendship[] = [
      {
        id: 'fr_1',
        requesterId: 'usr_sarah',
        addresseeId: 'usr_maya',
        status: 'accepted',
        createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
      },
      {
        id: 'fr_2',
        requesterId: 'usr_admin',
        addresseeId: 'usr_sarah',
        status: 'accepted',
        createdAt: new Date(Date.now() - 19 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 19 * 24 * 3600000).toISOString(),
      },
      {
        id: 'fr_3',
        requesterId: 'usr_alex',
        addresseeId: 'usr_sarah',
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
      },
    ];

    const posts: Post[] = [
      {
        id: 'post_1',
        authorId: 'usr_admin',
        content: '✨ Welcome to Subhu! A modern social network built with high standards of privacy, real-time messaging, WebRTC calling, and genuine community connections. Your data belongs to you.',
        mediaUrls: ['/src/assets/images/cover_landscape_aurora_1792752820966.jpg'],
        audience: 'public',
        feeling: 'celebrating',
        location: 'Subhu HQ',
        isPinned: true,
        createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
      {
        id: 'post_2',
        authorId: 'usr_sarah',
        content: 'Just deployed our new real-time WebSocket protocol and zero-latency audio/video calling subsystem. Everything runs directly peer-to-peer with verifiable end-to-end signaling. What are your thoughts on privacy-first social feeds?',
        mediaUrls: [],
        audience: 'public',
        feeling: 'excited',
        location: 'San Francisco, CA',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'post_3',
        authorId: 'usr_maya',
        content: 'Refining the Subhu design system: eliminating pill enclosures, respecting typographic scales, and guaranteeing WCAG AA accessibility contrast. Loving how crisp the UI feels.',
        mediaUrls: [],
        audience: 'friends',
        feeling: 'inspired',
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
    ];

    const reactions: PostReaction[] = [
      {
        id: 'rx_1',
        postId: 'post_1',
        userId: 'usr_sarah',
        type: 'love',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'rx_2',
        postId: 'post_1',
        userId: 'usr_maya',
        type: 'like',
        createdAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
      },
      {
        id: 'rx_3',
        postId: 'post_2',
        userId: 'usr_maya',
        type: 'love',
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
    ];

    const comments: Comment[] = [
      {
        id: 'cm_1',
        postId: 'post_1',
        authorId: 'usr_sarah',
        parentId: null,
        content: 'Thrilled to see Subhu launch. The community controls and transparency are exactly what the modern web needs.',
        createdAt: new Date(Date.now() - 2.5 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 2.5 * 3600000).toISOString(),
      },
      {
        id: 'cm_2',
        postId: 'post_1',
        authorId: 'usr_maya',
        parentId: 'cm_1',
        content: '100% agreed Sarah! The interface feels so clean and refreshing without intrusive ads.',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ];

    const stories: Story[] = [
      {
        id: 'st_1',
        authorId: 'usr_sarah',
        mediaUrl: '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
        mediaType: 'image',
        caption: 'Late night architecture session under the aurora sky 🌌',
        viewers: [{ userId: 'usr_maya', viewedAt: new Date(Date.now() - 30 * 60000).toISOString() }],
        expiresAt: oneDayAhead,
        createdAt: now,
      },
      {
        id: 'st_2',
        authorId: 'usr_maya',
        mediaUrl: '/src/assets/images/avatar_creative_user_1792752821026.jpg',
        mediaType: 'image',
        caption: 'Studio sketches for our responsive messaging drawer 🎨',
        viewers: [],
        expiresAt: oneDayAhead,
        createdAt: now,
      },
    ];

    const conversations: Conversation[] = [
      {
        id: 'conv_sarah_maya',
        type: 'direct',
        creatorId: 'usr_sarah',
        memberIds: ['usr_sarah', 'usr_maya'],
        createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      },
    ];

    const messages: Message[] = [
      {
        id: 'msg_1',
        conversationId: 'conv_sarah_maya',
        senderId: 'usr_sarah',
        content: 'Hey Maya! Have you had a chance to test the new WebRTC calling interface on Subhu?',
        readBy: [{ userId: 'usr_maya', readAt: new Date(Date.now() - 20 * 60000).toISOString() }],
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      },
      {
        id: 'msg_2',
        conversationId: 'conv_sarah_maya',
        senderId: 'usr_maya',
        content: 'Yes! The video quality is ultra-crisp and the audio latency is virtually zero. Testing out group signaling next.',
        readBy: [{ userId: 'usr_sarah', readAt: new Date(Date.now() - 14 * 60000).toISOString() }],
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      },
    ];

    const groups: Group[] = [
      {
        id: 'grp_1',
        name: 'Distributed Systems & Web Architects',
        slug: 'distributed-architects',
        description: 'A global community of software engineers discussing resilience, peer-to-peer protocols, and scalable social architectures.',
        coverImage: '/src/assets/images/cover_landscape_aurora_1792752820966.jpg',
        privacy: 'public',
        creatorId: 'usr_sarah',
        memberIds: ['usr_sarah', 'usr_maya', 'usr_admin'],
        createdAt: new Date(Date.now() - 25 * 24 * 3600000).toISOString(),
      },
      {
        id: 'grp_2',
        name: 'Digital Typography & Human Interfaces',
        slug: 'typography-interfaces',
        description: 'Designers focusing on accessible contrast, zero-pill metadata, and intentional UI rhythm.',
        coverImage: '/src/assets/images/subhu_brand_logo_1792752821003.jpg',
        privacy: 'public',
        creatorId: 'usr_maya',
        memberIds: ['usr_maya', 'usr_sarah'],
        createdAt: new Date(Date.now() - 18 * 24 * 3600000).toISOString(),
      },
    ];

    const notifications: Notification[] = [
      {
        id: 'notif_1',
        recipientId: 'usr_sarah',
        senderId: 'usr_alex',
        type: 'friend_request',
        entityId: 'fr_3',
        entityType: 'user',
        message: 'Alex Rivera sent you a friend request.',
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
      },
      {
        id: 'notif_2',
        recipientId: 'usr_sarah',
        senderId: 'usr_maya',
        type: 'post_reaction',
        entityId: 'post_2',
        entityType: 'post',
        message: 'Maya Lin loved your post about WebRTC calling.',
        isRead: true,
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
    ];

    return {
      version: 1,
      users,
      sessions: [],
      friendships,
      follows: [],
      posts,
      reactions,
      comments,
      savedPosts: [],
      stories,
      conversations,
      messages,
      calls: [],
      notifications,
      reports: [],
      auditLogs: [],
      groups,
    };
  }

  // --- User Operations ---
  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getAllUsers(): User[] {
    return this.data.users;
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...userData,
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return user;
  }

  // --- Session Operations ---
  public createSession(userId: string, ipAddress = '127.0.0.1', userAgent = 'SubhuClient'): UserSession {
    const session: UserSession = {
      id: `ses_${crypto.randomUUID()}`,
      userId,
      token: crypto.randomBytes(32).toString('hex'),
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(), // 30 days
      lastActiveAt: new Date().toISOString(),
    };
    this.data.sessions.push(session);
    this.persist();
    return session;
  }

  public getSessionByToken(token: string): UserSession | undefined {
    const session = this.data.sessions.find((s) => s.token === token && !s.revokedAt);
    if (!session) return undefined;
    if (new Date(session.expiresAt) < new Date()) {
      session.revokedAt = new Date().toISOString();
      this.persist();
      return undefined;
    }
    session.lastActiveAt = new Date().toISOString();
    return session;
  }

  public revokeSession(token: string): void {
    const session = this.data.sessions.find((s) => s.token === token);
    if (session) {
      session.revokedAt = new Date().toISOString();
      this.persist();
    }
  }

  // --- Friendship & Social Graph ---
  public getFriendship(u1: string, u2: string): Friendship | undefined {
    return this.data.friendships.find(
      (f) =>
        (f.requesterId === u1 && f.addresseeId === u2) ||
        (f.requesterId === u2 && f.addresseeId === u1)
    );
  }

  public areFriends(u1: string, u2: string): boolean {
    if (u1 === u2) return true;
    const f = this.getFriendship(u1, u2);
    return f !== undefined && f.status === 'accepted';
  }

  public isBlocked(u1: string, u2: string): boolean {
    const f = this.getFriendship(u1, u2);
    return f !== undefined && f.status === 'blocked';
  }

  public sendFriendRequest(requesterId: string, addresseeId: string): { success: boolean; friendship?: Friendship; error?: string } {
    if (requesterId === addresseeId) {
      return { success: false, error: 'Cannot send friend request to yourself' };
    }
    const existing = this.getFriendship(requesterId, addresseeId);
    if (existing) {
      if (existing.status === 'accepted') return { success: false, error: 'Already friends' };
      if (existing.status === 'pending') return { success: false, error: 'Friend request already pending' };
      if (existing.status === 'blocked') return { success: false, error: 'Cannot connect with blocked user' };
    }

    const friendship: Friendship = {
      id: `fr_${crypto.randomUUID().slice(0, 8)}`,
      requesterId,
      addresseeId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.friendships.push(friendship);

    // Create notification
    const sender = this.getUserById(requesterId);
    this.createNotification({
      recipientId: addresseeId,
      senderId: requesterId,
      type: 'friend_request',
      entityId: friendship.id,
      entityType: 'user',
      message: `${sender?.fullName || 'Someone'} sent you a friend request.`,
    });

    this.persist();
    return { success: true, friendship };
  }

  public respondFriendRequest(friendshipId: string, userId: string, accept: boolean): boolean {
    const f = this.data.friendships.find((item) => item.id === friendshipId);
    if (!f || f.addresseeId !== userId || f.status !== 'pending') return false;

    f.status = accept ? 'accepted' : 'declined';
    f.updatedAt = new Date().toISOString();

    if (accept) {
      const recipient = this.getUserById(userId);
      this.createNotification({
        recipientId: f.requesterId,
        senderId: userId,
        type: 'friend_accept',
        entityId: f.id,
        entityType: 'user',
        message: `${recipient?.fullName || 'Someone'} accepted your friend request.`,
      });
    }

    this.persist();
    return true;
  }

  public listFriends(userId: string): User[] {
    const friendIds = this.data.friendships
      .filter((f) => f.status === 'accepted' && (f.requesterId === userId || f.addresseeId === userId))
      .map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId));

    return this.data.users.filter((u) => friendIds.includes(u.id));
  }

  public listPendingRequests(userId: string): { incoming: (Friendship & { requester: User })[]; outgoing: Friendship[] } {
    const incomingRaw = this.data.friendships.filter((f) => f.addresseeId === userId && f.status === 'pending');
    const outgoing = this.data.friendships.filter((f) => f.requesterId === userId && f.status === 'pending');

    const incoming = incomingRaw.map((f) => ({
      ...f,
      requester: this.getUserById(f.requesterId)!,
    })).filter((f) => !!f.requester);

    return { incoming, outgoing };
  }

  // --- Posts & Feed Engine ---
  public getFeedPosts(viewerId: string, filter?: 'all' | 'friends' | 'saved'): (Post & {
    author: User;
    reactions: PostReaction[];
    reactionCounts: Record<string, number>;
    userReaction?: string;
    commentCount: number;
    isSaved: boolean;
  })[] {
    let posts = this.data.posts.filter((p) => !p.isDeleted);

    // Apply audience privacy rules
    posts = posts.filter((p) => {
      // 1. Never show if author is blocked or blocked viewer
      if (this.isBlocked(p.authorId, viewerId)) return false;

      // 2. Author can always see their own posts
      if (p.authorId === viewerId) return true;

      // 3. Audience checks
      if (p.audience === 'public') return true;
      if (p.audience === 'friends') {
        return this.areFriends(p.authorId, viewerId);
      }
      if (p.audience === 'only_me') return false;
      return false;
    });

    if (filter === 'friends') {
      const friends = this.listFriends(viewerId).map((u) => u.id);
      posts = posts.filter((p) => friends.includes(p.authorId));
    } else if (filter === 'saved') {
      const savedIds = this.data.savedPosts.filter((s) => s.userId === viewerId).map((s) => s.postId);
      posts = posts.filter((p) => savedIds.includes(p.id));
    }

    // Sort by pinned first, then newest
    posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return posts.map((post) => {
      const author = this.getUserById(post.authorId) || {
        id: post.authorId,
        username: 'deleted_user',
        fullName: 'Subhu User',
        avatar: '',
        isVerified: false,
      } as User;

      const postReactions = this.data.reactions.filter((r) => r.postId === post.id);
      const reactionCounts: Record<string, number> = {};
      postReactions.forEach((r) => {
        reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
      });

      const userReaction = postReactions.find((r) => r.userId === viewerId)?.type;
      const commentCount = this.data.comments.filter((c) => c.postId === post.id && !c.isDeleted).length;
      const isSaved = this.data.savedPosts.some((s) => s.userId === viewerId && s.postId === post.id);

      return {
        ...post,
        author,
        reactions: postReactions,
        reactionCounts,
        userReaction,
        commentCount,
        isSaved,
      };
    });
  }

  public createPost(data: {
    authorId: string;
    content: string;
    mediaUrls?: string[];
    audience: Audience;
    feeling?: string;
    location?: string;
  }): Post {
    const post: Post = {
      id: `post_${crypto.randomUUID().slice(0, 8)}`,
      authorId: data.authorId,
      content: data.content,
      mediaUrls: data.mediaUrls || [],
      audience: data.audience || 'public',
      feeling: data.feeling,
      location: data.location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.posts.unshift(post);
    this.persist();
    return post;
  }

  public deletePost(postId: string, userId: string, isAdmin = false): boolean {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) return false;
    if (post.authorId !== userId && !isAdmin) return false;

    post.isDeleted = true;
    post.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  public toggleReaction(postId: string, userId: string, type: PostReaction['type']): {
    action: 'added' | 'removed' | 'updated';
    reaction?: PostReaction;
  } {
    const existingIndex = this.data.reactions.findIndex((r) => r.postId === postId && r.userId === userId);
    const post = this.data.posts.find((p) => p.id === postId);

    if (existingIndex >= 0) {
      if (this.data.reactions[existingIndex].type === type) {
        this.data.reactions.splice(existingIndex, 1);
        this.persist();
        return { action: 'removed' };
      } else {
        this.data.reactions[existingIndex].type = type;
        this.persist();
        return { action: 'updated', reaction: this.data.reactions[existingIndex] };
      }
    }

    const reaction: PostReaction = {
      id: `rx_${crypto.randomUUID().slice(0, 8)}`,
      postId,
      userId,
      type,
      createdAt: new Date().toISOString(),
    };
    this.data.reactions.push(reaction);

    if (post && post.authorId !== userId) {
      const user = this.getUserById(userId);
      this.createNotification({
        recipientId: post.authorId,
        senderId: userId,
        type: 'post_reaction',
        entityId: post.id,
        entityType: 'post',
        message: `${user?.fullName || 'Someone'} reacted to your post.`,
      });
    }

    this.persist();
    return { action: 'added', reaction };
  }

  // --- Comments ---
  public getComments(postId: string): (Comment & { author: User; replies: (Comment & { author: User })[] })[] {
    const postComments = this.data.comments
      .filter((c) => c.postId === postId && !c.isDeleted)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const topLevel = postComments.filter((c) => !c.parentId);

    return topLevel.map((comment) => {
      const author = this.getUserById(comment.authorId) || {
        id: comment.authorId,
        username: 'deleted',
        fullName: 'Subhu User',
        avatar: '',
      } as User;

      const replies = postComments
        .filter((c) => c.parentId === comment.id)
        .map((rep) => ({
          ...rep,
          author: this.getUserById(rep.authorId) || {
            id: rep.authorId,
            username: 'deleted',
            fullName: 'Subhu User',
            avatar: '',
          } as User,
        }));

      return {
        ...comment,
        author,
        replies,
      };
    });
  }

  public addComment(data: { postId: string; authorId: string; content: string; parentId?: string | null }): Comment {
    const comment: Comment = {
      id: `cm_${crypto.randomUUID().slice(0, 8)}`,
      postId: data.postId,
      authorId: data.authorId,
      parentId: data.parentId || null,
      content: data.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.comments.push(comment);

    const post = this.data.posts.find((p) => p.id === data.postId);
    if (post && post.authorId !== data.authorId) {
      const author = this.getUserById(data.authorId);
      this.createNotification({
        recipientId: post.authorId,
        senderId: data.authorId,
        type: data.parentId ? 'comment_reply' : 'post_comment',
        entityId: post.id,
        entityType: 'post',
        message: `${author?.fullName || 'Someone'} ${data.parentId ? 'replied to a comment' : 'commented on your post'}.`,
      });
    }

    this.persist();
    return comment;
  }

  public toggleSavePost(userId: string, postId: string): boolean {
    const idx = this.data.savedPosts.findIndex((s) => s.userId === userId && s.postId === postId);
    if (idx >= 0) {
      this.data.savedPosts.splice(idx, 1);
      this.persist();
      return false; // unsaved
    }
    this.data.savedPosts.push({
      id: `save_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      postId,
      createdAt: new Date().toISOString(),
    });
    this.persist();
    return true; // saved
  }

  // --- Stories ---
  public getActiveStories(viewerId: string): (Story & { author: User; hasViewed: boolean })[] {
    const now = new Date();
    const active = this.data.stories.filter((s) => new Date(s.expiresAt) > now);

    return active
      .filter((s) => !this.isBlocked(s.authorId, viewerId))
      .map((story) => {
        const author = this.getUserById(story.authorId) || {
          id: story.authorId,
          username: 'user',
          fullName: 'Subhu User',
          avatar: '',
        } as User;
        const hasViewed = story.viewers.some((v) => v.userId === viewerId);
        return {
          ...story,
          author,
          hasViewed,
        };
      });
  }

  public createStory(authorId: string, mediaUrl: string, caption = ''): Story {
    const story: Story = {
      id: `st_${crypto.randomUUID().slice(0, 8)}`,
      authorId,
      mediaUrl,
      mediaType: 'image',
      caption,
      viewers: [],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.data.stories.unshift(story);
    this.persist();
    return story;
  }

  public markStoryViewed(storyId: string, userId: string): void {
    const story = this.data.stories.find((s) => s.id === storyId);
    if (!story) return;
    if (!story.viewers.some((v) => v.userId === userId)) {
      story.viewers.push({ userId, viewedAt: new Date().toISOString() });
      this.persist();
    }
  }

  // --- Conversations & Messaging ---
  public getOrCreateDirectConversation(u1: string, u2: string): Conversation {
    const existing = this.data.conversations.find(
      (c) => c.type === 'direct' && c.memberIds.includes(u1) && c.memberIds.includes(u2)
    );
    if (existing) return existing;

    const conv: Conversation = {
      id: `conv_${crypto.randomUUID().slice(0, 8)}`,
      type: 'direct',
      creatorId: u1,
      memberIds: [u1, u2],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.conversations.push(conv);
    this.persist();
    return conv;
  }

  public getConversations(userId: string): (Conversation & {
    otherMember?: User;
    lastMessage?: Message;
    unreadCount: number;
  })[] {
    const userConvs = this.data.conversations.filter((c) => c.memberIds.includes(userId));

    return userConvs.map((conv) => {
      const otherId = conv.memberIds.find((id) => id !== userId) || conv.creatorId;
      const otherMember = this.getUserById(otherId);

      const convMessages = this.data.messages
        .filter((m) => m.conversationId === conv.id && !m.isDeleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const lastMessage = convMessages[0];
      const unreadCount = convMessages.filter(
        (m) => m.senderId !== userId && !m.readBy.some((r) => r.userId === userId)
      ).length;

      return {
        ...conv,
        otherMember,
        lastMessage,
        unreadCount,
      };
    }).sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  }

  public getMessages(conversationId: string, viewerId: string): (Message & { sender: User })[] {
    const conv = this.data.conversations.find((c) => c.id === conversationId);
    if (!conv || !conv.memberIds.includes(viewerId)) return [];

    const messages = this.data.messages
      .filter((m) => m.conversationId === conversationId && !m.isDeleted)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Mark unread messages as read
    let updated = false;
    messages.forEach((m) => {
      if (m.senderId !== viewerId && !m.readBy.some((r) => r.userId === viewerId)) {
        m.readBy.push({ userId: viewerId, readAt: new Date().toISOString() });
        updated = true;
      }
    });
    if (updated) this.persist();

    return messages.map((m) => ({
      ...m,
      sender: this.getUserById(m.senderId) || {
        id: m.senderId,
        username: 'deleted',
        fullName: 'Subhu User',
        avatar: '',
      } as User,
    }));
  }

  public sendMessage(conversationId: string, senderId: string, content: string, attachments?: string[]): Message {
    const message: Message = {
      id: `msg_${crypto.randomUUID().slice(0, 8)}`,
      conversationId,
      senderId,
      content,
      attachments: attachments || [],
      readBy: [{ userId: senderId, readAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    this.data.messages.push(message);

    const conv = this.data.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.updatedAt = message.createdAt;
      // Notify other members
      conv.memberIds
        .filter((id) => id !== senderId)
        .forEach((recipientId) => {
          const sender = this.getUserById(senderId);
          this.createNotification({
            recipientId,
            senderId,
            type: 'mention',
            entityId: conv.id,
            entityType: 'conversation',
            message: `${sender?.fullName || 'Someone'}: ${content.slice(0, 40)}`,
          });
        });
    }

    this.persist();
    return message;
  }

  // --- WebRTC Calling Sessions ---
  public createCallSession(callerId: string, calleeId: string, type: 'audio' | 'video'): CallSession {
    const call: CallSession = {
      id: `call_${crypto.randomUUID().slice(0, 8)}`,
      callerId,
      calleeId,
      type,
      status: 'ringing',
      startedAt: new Date().toISOString(),
    };
    this.data.calls.push(call);
    this.persist();
    return call;
  }

  public updateCallStatus(callId: string, status: CallSession['status']): CallSession | undefined {
    const call = this.data.calls.find((c) => c.id === callId);
    if (!call) return undefined;
    call.status = status;
    if (status === 'ended' || status === 'declined' || status === 'missed') {
      call.endedAt = new Date().toISOString();
      if (call.startedAt) {
        call.durationSeconds = Math.max(0, Math.floor((new Date().getTime() - new Date(call.startedAt).getTime()) / 1000));
      }
    }
    this.persist();
    return call;
  }

  // --- Notifications ---
  public createNotification(data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Notification {
    const notif: Notification = {
      ...data,
      id: `notif_${crypto.randomUUID().slice(0, 8)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.persist();
    return notif;
  }

  public getNotifications(userId: string): (Notification & { sender?: User })[] {
    return this.data.notifications
      .filter((n) => n.recipientId === userId)
      .map((n) => ({
        ...n,
        sender: this.getUserById(n.senderId),
      }))
      .slice(0, 50);
  }

  public markNotificationRead(id: string, userId: string): boolean {
    const n = this.data.notifications.find((item) => item.id === id && item.recipientId === userId);
    if (!n) return false;
    n.isRead = true;
    this.persist();
    return true;
  }

  public markAllNotificationsRead(userId: string): void {
    this.data.notifications
      .filter((n) => n.recipientId === userId)
      .forEach((n) => (n.isRead = true));
    this.persist();
  }

  // --- Moderation & Reports ---
  public createReport(data: {
    reporterId: string;
    targetId: string;
    targetType: Report['targetType'];
    reason: string;
    details: string;
  }): Report {
    const report: Report = {
      id: `rep_${crypto.randomUUID().slice(0, 8)}`,
      reporterId: data.reporterId,
      targetId: data.targetId,
      targetType: data.targetType,
      reason: data.reason,
      details: data.details,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.data.reports.unshift(report);
    this.createAuditLog({
      actorId: data.reporterId,
      action: 'SUBMIT_REPORT',
      targetType: data.targetType,
      targetId: data.targetId,
      details: `Report filed for reason: ${data.reason}`,
    });
    this.persist();
    return report;
  }

  public getReports(): (Report & { reporter: User })[] {
    return this.data.reports.map((r) => ({
      ...r,
      reporter: this.getUserById(r.reporterId) || {
        id: r.reporterId,
        username: 'user',
        fullName: 'Reporter',
        avatar: '',
      } as User,
    }));
  }

  public resolveReport(reportId: string, moderatorId: string, action: 'action_taken' | 'dismissed', notes: string): boolean {
    const report = this.data.reports.find((r) => r.id === reportId);
    if (!report) return false;
    report.status = action;
    report.moderatorId = moderatorId;
    report.moderatorNotes = notes;
    report.resolvedAt = new Date().toISOString();

    this.createAuditLog({
      actorId: moderatorId,
      action: `RESOLVE_REPORT_${action.toUpperCase()}`,
      targetType: report.targetType,
      targetId: report.targetId,
      details: notes,
    });

    this.persist();
    return true;
  }

  public createAuditLog(data: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const log: AuditLog = {
      ...data,
      id: `audit_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    this.persist();
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs.slice(0, 100);
  }

  // --- Search ---
  public search(query: string, viewerId: string) {
    const q = query.toLowerCase().trim();
    if (!q) return { users: [], posts: [], groups: [] };

    const users = this.data.users
      .filter((u) => u.username.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q))
      .slice(0, 10);

    const posts = this.getFeedPosts(viewerId)
      .filter((p) => p.content.toLowerCase().includes(q))
      .slice(0, 10);

    const groups = this.data.groups
      .filter((g) => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
      .slice(0, 10);

    return { users, posts, groups };
  }

  // --- Automated In-Engine Test Suite ---
  public runAutomatedTests(): {
    total: number;
    passed: number;
    failed: number;
    durationMs: number;
    results: { name: string; passed: boolean; message?: string }[];
  } {
    const start = Date.now();
    const results: { name: string; passed: boolean; message?: string }[] = [];

    const test = (name: string, fn: () => void) => {
      try {
        fn();
        results.push({ name, passed: true });
      } catch (err: any) {
        results.push({ name, passed: false, message: err?.message || String(err) });
      }
    };

    // 1. Password Security & Hashing
    test('Password Hashing: Salt and PBKDF2 verification', () => {
      const pass = 'SuperSecret123!';
      const { hash, salt } = SubhuDatabase.hashPassword(pass);
      if (!hash || !salt) throw new Error('Hash or salt empty');
      if (!SubhuDatabase.verifyPassword(pass, hash, salt)) throw new Error('Password verification failed');
      if (SubhuDatabase.verifyPassword('WrongPass', hash, salt)) throw new Error('Incorrect password verified successfully');
    });

    // 2. User Retrieval & Email Uniqueness
    test('User Repository: Search by email and username', () => {
      const user = this.getUserByEmail('sarah@subhu.social');
      if (!user) throw new Error('Seed user sarah not found');
      if (user.username !== 'sarah_chen') throw new Error('Username mismatch');
    });

    // 3. Session Generation & Revocation
    test('Session Engine: Create and validate session token', () => {
      const session = this.createSession('usr_sarah');
      const retrieved = this.getSessionByToken(session.token);
      if (!retrieved || retrieved.userId !== 'usr_sarah') throw new Error('Session not retrieved');
      this.revokeSession(session.token);
      const afterRevoke = this.getSessionByToken(session.token);
      if (afterRevoke) throw new Error('Revoked session still valid');
    });

    // 4. Friendship State Machine
    test('Social Graph: Friend request lifecycle', () => {
      const testU1 = 'test_req_' + Date.now();
      const testU2 = 'test_add_' + Date.now();
      const req = this.sendFriendRequest(testU1, testU2);
      if (!req.success || !req.friendship) throw new Error('Friend request creation failed');
      if (req.friendship.status !== 'pending') throw new Error('Status not pending');

      // Respond
      const accepted = this.respondFriendRequest(req.friendship.id, testU2, true);
      if (!accepted) throw new Error('Friend request acceptance failed');
      if (!this.areFriends(testU1, testU2)) throw new Error('areFriends returned false after acceptance');
    });

    // 5. Post Privacy & Audience Rules
    test('Privacy Engine: Friends-only post visibility rule', () => {
      // Sarah and Maya are friends, Alex is not
      const sarahFeed = this.getFeedPosts('usr_sarah');
      const mayaFeed = this.getFeedPosts('usr_maya');
      const alexFeed = this.getFeedPosts('usr_alex');

      // post_3 is authored by Maya with audience 'friends'
      const inMaya = mayaFeed.some((p) => p.id === 'post_3');
      const inSarah = sarahFeed.some((p) => p.id === 'post_3');
      const inAlex = alexFeed.some((p) => p.id === 'post_3');

      if (!inMaya) throw new Error('Author cannot see own friends post');
      if (!inSarah) throw new Error('Friend cannot see friends-only post');
      if (inAlex) throw new Error('Non-friend was able to see friends-only post! (Privacy breach)');
    });

    // 6. Reactions Toggling & Duplicate Prevention
    test('Reaction Engine: Toggle like reaction on post', () => {
      const tempUser = 'usr_alex';
      const postId = 'post_1';
      const first = this.toggleReaction(postId, tempUser, 'like');
      if (first.action !== 'added') throw new Error('First reaction was not added');

      // Same reaction again should remove it (toggle)
      const second = this.toggleReaction(postId, tempUser, 'like');
      if (second.action !== 'removed') throw new Error('Second reaction was not removed');
    });

    // 7. Threaded Comments
    test('Comment Engine: Add and retrieve comment hierarchy', () => {
      const post = this.data.posts[0];
      const comment = this.addComment({
        postId: post.id,
        authorId: 'usr_sarah',
        content: 'Automated test root comment',
      });
      const reply = this.addComment({
        postId: post.id,
        authorId: 'usr_maya',
        parentId: comment.id,
        content: 'Automated test child reply',
      });

      const list = this.getComments(post.id);
      const root = list.find((c) => c.id === comment.id);
      if (!root) throw new Error('Root comment not found');
      if (!root.replies.some((r) => r.id === reply.id)) throw new Error('Reply not linked to parent');
    });

    // 8. Ephemeral Stories Expiration
    test('Stories Engine: 24h expiration timestamp check', () => {
      const story = this.createStory('usr_sarah', '/sample.jpg', 'Ephemeral test');
      const expiry = new Date(story.expiresAt).getTime();
      const created = new Date(story.createdAt).getTime();
      const diffHours = (expiry - created) / 3600000;
      if (Math.round(diffHours) !== 24) throw new Error(`Story expiry not 24h: was ${diffHours}`);
    });

    // 9. Messaging & Conversation Validation
    test('Messaging Engine: Send message in conversation', () => {
      const conv = this.getOrCreateDirectConversation('usr_sarah', 'usr_alex');
      const msg = this.sendMessage(conv.id, 'usr_sarah', 'Hello Alex, automated test message');
      if (!msg.id || msg.content !== 'Hello Alex, automated test message') throw new Error('Message dispatch failed');
      const history = this.getMessages(conv.id, 'usr_alex');
      if (!history.some((m) => m.id === msg.id)) throw new Error('Message not in conversation history');
    });

    // 10. Moderation & Audit Logging
    test('Moderation: File report and audit log recording', () => {
      const report = this.createReport({
        reporterId: 'usr_sarah',
        targetId: 'post_2',
        targetType: 'post',
        reason: 'spam',
        details: 'Testing audit log creation',
      });
      if (report.status !== 'pending') throw new Error('Report status not pending');
      const resolved = this.resolveReport(report.id, 'usr_admin', 'dismissed', 'False positive verified');
      if (!resolved) throw new Error('Report resolution failed');
      const audits = this.getAuditLogs();
      if (!audits.some((a) => a.action.includes('RESOLVE_REPORT_DISMISSED'))) {
        throw new Error('Audit log for report resolution not found');
      }
    });

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    return {
      total: results.length,
      passed,
      failed,
      durationMs: Date.now() - start,
      results,
    };
  }
}
