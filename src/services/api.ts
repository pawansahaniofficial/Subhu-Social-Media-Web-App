import { User, Post, Comment, Story, Conversation, Message, Notification, Report, AuditLog } from '../types/index.js';

const API_BASE = '/api/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('subhu_token') : null;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('subhu_token', token);
    } else {
      localStorage.removeItem('subhu_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || `HTTP error ${res.status}`;
      if (res.status === 401 && this.token) {
        // Session expired
        this.setToken(null);
      }
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // --- Auth ---
  public async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setToken(data.token);
    return data;
  }

  public async register(payload: { username: string; email: string; password: string; fullName: string }): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.token);
    return data;
  }

  public async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  public async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  }

  // --- Posts & Feed ---
  public async getPosts(filter: 'all' | 'friends' | 'saved' = 'all'): Promise<{ posts: Post[] }> {
    return this.request<{ posts: Post[] }>(`/posts?filter=${filter}`);
  }

  public async createPost(payload: {
    content: string;
    mediaUrls?: string[];
    audience: 'public' | 'friends' | 'only_me';
    feeling?: string;
    location?: string;
  }): Promise<{ post: Post }> {
    return this.request<{ post: Post }>('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async deletePost(postId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/posts/${postId}`, { method: 'DELETE' });
  }

  public async reactToPost(postId: string, type: string): Promise<{ action: string }> {
    return this.request(`/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  public async getComments(postId: string): Promise<{ comments: Comment[] }> {
    return this.request<{ comments: Comment[] }>(`/posts/${postId}/comments`);
  }

  public async addComment(postId: string, content: string, parentId?: string | null): Promise<{ comment: Comment }> {
    return this.request<{ comment: Comment }>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  }

  public async savePost(postId: string): Promise<{ isSaved: boolean; message: string }> {
    return this.request<{ isSaved: boolean; message: string }>(`/posts/${postId}/save`, {
      method: 'POST',
    });
  }

  // --- Users & Profile ---
  public async getUserProfile(username: string): Promise<{ profile: User & { friendsCount: number; postsCount: number; friendshipStatus: string; isRequester: boolean; areFriends: boolean }; posts: Post[] }> {
    return this.request(`/users/${username}`);
  }

  public async updateProfile(payload: Partial<User>): Promise<{ user: User }> {
    return this.request<{ user: User }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async getSuggestedUsers(): Promise<{ suggestions: User[] }> {
    return this.request<{ suggestions: User[] }>('/users/suggestions');
  }

  // --- Friends ---
  public async getFriends(): Promise<{ friends: User[]; pendingIncoming: any[]; pendingOutgoing: any[] }> {
    return this.request('/friends');
  }

  public async sendFriendRequest(targetUserId: string): Promise<{ success: boolean }> {
    return this.request('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  }

  public async respondFriendRequest(friendshipId: string, accept: boolean): Promise<{ success: boolean }> {
    return this.request('/friends/respond', {
      method: 'POST',
      body: JSON.stringify({ friendshipId, accept }),
    });
  }

  // --- Stories ---
  public async getStories(): Promise<{ stories: Story[] }> {
    return this.request<{ stories: Story[] }>('/stories');
  }

  public async createStory(mediaUrl: string, caption?: string): Promise<{ story: Story }> {
    return this.request<{ story: Story }>('/stories', {
      method: 'POST',
      body: JSON.stringify({ mediaUrl, caption }),
    });
  }

  public async markStoryViewed(storyId: string): Promise<void> {
    await this.request(`/stories/${storyId}/view`, { method: 'POST' });
  }

  // --- Messaging ---
  public async getConversations(): Promise<{ conversations: Conversation[] }> {
    return this.request<{ conversations: Conversation[] }>('/messages/conversations');
  }

  public async getMessages(conversationId: string): Promise<{ messages: Message[] }> {
    return this.request<{ messages: Message[] }>(`/messages/conversations/${conversationId}`);
  }

  public async createConversation(recipientId: string): Promise<{ conversation: Conversation }> {
    return this.request<{ conversation: Conversation }>('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    });
  }

  public async sendMessage(conversationId: string, content: string, attachments?: string[]): Promise<{ message: Message }> {
    return this.request<{ message: Message }>('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ conversationId, content, attachments }),
    });
  }

  // --- Calling ---
  public async initiateCall(calleeId: string, type: 'audio' | 'video'): Promise<{ call: any; callee: User }> {
    return this.request('/calls/initiate', {
      method: 'POST',
      body: JSON.stringify({ calleeId, type }),
    });
  }

  public async updateCallStatus(callId: string, status: string): Promise<{ call: any }> {
    return this.request(`/calls/${callId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // --- Notifications ---
  public async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    return this.request<{ notifications: Notification[]; unreadCount: number }>('/notifications');
  }

  public async markNotificationRead(id: string): Promise<void> {
    await this.request(`/notifications/${id}/read`, { method: 'POST' });
  }

  public async markAllNotificationsRead(): Promise<void> {
    await this.request('/notifications/mark-all-read', { method: 'POST' });
  }

  // --- Search ---
  public async search(query: string): Promise<{ results: { users: User[]; posts: Post[]; groups: any[] } }> {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // --- Moderation ---
  public async reportContent(payload: { targetId: string; targetType: string; reason: string; details?: string }): Promise<{ message: string }> {
    return this.request('/moderation/report', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getReports(): Promise<{ reports: Report[] }> {
    return this.request<{ reports: Report[] }>('/moderation/reports');
  }

  public async resolveReport(reportId: string, action: 'action_taken' | 'dismissed', notes: string): Promise<void> {
    await this.request('/moderation/resolve', {
      method: 'POST',
      body: JSON.stringify({ reportId, action, notes }),
    });
  }

  public async getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    return this.request<{ logs: AuditLog[] }>('/moderation/audit-logs');
  }

  // --- System Tests ---
  public async runSystemTests(): Promise<{
    total: number;
    passed: number;
    failed: number;
    durationMs: number;
    results: { name: string; passed: boolean; message?: string }[];
  }> {
    return this.request('/system/tests/run', { method: 'POST' });
  }
}

export const api = new ApiService();
