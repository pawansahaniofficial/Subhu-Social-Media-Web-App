export interface User {
  id: string;
  username: string;
  email: string;
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
}

export type Audience = 'public' | 'friends' | 'only_me';

export interface Post {
  id: string;
  authorId: string;
  author: User;
  content: string;
  mediaUrls: string[];
  audience: Audience;
  feeling?: string;
  location?: string;
  isPinned?: boolean;
  isEdited?: boolean;
  reactions: { id: string; postId: string; userId: string; type: string }[];
  reactionCounts: Record<string, number>;
  userReaction?: string;
  commentCount: number;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  parentId?: string | null;
  content: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  author: User;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  hasViewed: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  creatorId: string;
  memberIds: string[];
  otherMember?: User;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  attachments?: string[];
  readBy?: { userId: string; readAt: string }[];
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  sender?: User;
  type: string;
  entityId: string;
  entityType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporter?: User;
  targetId: string;
  targetType: 'post' | 'user' | 'comment' | 'message';
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  moderatorNotes?: string;
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
  createdAt: string;
}
