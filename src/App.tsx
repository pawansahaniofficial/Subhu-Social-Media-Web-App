import React, { useState, useEffect } from 'react';
import { User, Post, Story } from './types/index.js';
import { api } from './services/api.js';
import { wsClient } from './services/websocket.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { RightSidebar } from './components/RightSidebar.js';
import { StoriesBar } from './components/StoriesBar.js';
import { PostComposer } from './components/PostComposer.js';
import { PostCard } from './components/PostCard.js';
import { ChatModal } from './components/ChatModal.js';
import { CallModal } from './components/CallModal.js';
import { ProfileModal } from './components/ProfileModal.js';
import { ModerationModal } from './components/ModerationModal.js';
import { TestSuiteModal } from './components/TestSuiteModal.js';
import { AuthModal } from './components/AuthModal.js';
import {
  Users,
  Compass,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [feedFilter, setFeedFilter] = useState<'all' | 'friends' | 'saved'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [profileModalUser, setProfileModalUser] = useState<User | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState<User | null>(null);
  const [callModalData, setCallModalData] = useState<{ callee: User; type: 'audio' | 'video'; isIncoming?: boolean } | null>(null);
  const [moderationModalOpen, setModerationModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [testSuiteModalOpen, setTestSuiteModalOpen] = useState(false);

  // Theme Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial Auth Check
  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (!token) {
        // Demo auto-login is development-only and must be explicitly enabled.
        if (!(import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true')) return;
        try {
          const res = await api.login('sarah_chen', 'Welcome123!');
          setCurrentUser(res.user);
        } catch {
          // not critical
        }
        return;
      }

      try {
        const res = await api.getMe();
        setCurrentUser(res.user);
      } catch (err) {
        api.setToken(null);
        setCurrentUser(null);
      }
    };

    initAuth();
  }, []);

  // Real-Time WebSocket Connection & Signaling
  useEffect(() => {
    if (!currentUser) return;
    const token = api.getToken();
    if (!token) return;

    wsClient.connect(token);

    // Incoming WebRTC Call Handler
    const unsubCall = wsClient.on('webrtc_incoming_call', (payload) => {
      if (payload.caller) {
        setCallModalData({
          callee: payload.caller,
          type: payload.callType || 'video',
          isIncoming: true,
        });
      }
    });

    const unsubMsg = wsClient.on('new_message', (payload) => {
      if (payload.message && payload.message.senderId !== currentUser.id) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
    });

    return () => {
      unsubCall();
      unsubMsg();
    };
  }, [currentUser]);

  // Load Feed Posts
  const loadPosts = async () => {
    try {
      const res = await api.getPosts(feedFilter);
      setPosts(res.posts);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Stories
  const loadStories = async () => {
    try {
      const res = await api.getStories();
      setStories(res.stories);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Social Graph (Friends, Requests, Suggestions)
  const loadSocialData = async () => {
    try {
      const [friendsRes, sugRes] = await Promise.all([
        api.getFriends(),
        api.getSuggestedUsers(),
      ]);
      setFriends(friendsRes.friends);
      setPendingIncoming(friendsRes.pendingIncoming);
      setSuggestedUsers(sugRes.suggestions);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [feedFilter, currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadStories();
      loadSocialData();
    }
  }, [currentUser]);

  const handleRespondFriendRequest = async (friendshipId: string, accept: boolean) => {
    try {
      await api.respondFriendRequest(friendshipId, accept);
      loadSocialData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await api.sendFriendRequest(userId);
      loadSocialData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    wsClient.disconnect();
    setCurrentUser(null);
    setPosts([]);
    setFriends([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Universal Top Bar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenProfile={(u) => setProfileModalUser(u)}
        unreadMessagesCount={unreadMessagesCount}
        onOpenChat={() => {
          setUnreadMessagesCount(0);
          setChatRecipient(null);
          setChatModalOpen(true);
        }}
        onOpenTestSuite={() => setTestSuiteModalOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main 3-Column Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start justify-center gap-6">
          
          {/* Left Column Navigation & Profile */}
          <Sidebar
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenProfile={(u) => setProfileModalUser(u)}
            onOpenTestSuite={() => setTestSuiteModalOpen(true)}
            onOpenChat={() => {
              setChatRecipient(null);
              setChatModalOpen(true);
            }}
            feedFilter={feedFilter}
            setFeedFilter={setFeedFilter}
            pendingRequestsCount={pendingIncoming.length}
          />

          {/* Center Column: Feed / Communities / Friends View */}
          <section className="flex-1 max-w-2xl w-full space-y-5">
            
            {/* Active Tab: Home Feed */}
            {activeTab === 'feed' && (
              <>
                {/* 24h Ephemeral Stories Bar */}
                {currentUser && (
                  <StoriesBar
                    currentUser={currentUser}
                    stories={stories}
                    onRefreshStories={loadStories}
                  />
                )}

                {/* Rich Post Composer */}
                <PostComposer
                  currentUser={currentUser}
                  onPostCreated={loadPosts}
                  onOpenAuth={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                />

                {/* Filter Segments */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <button
                      onClick={() => setFeedFilter('all')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        feedFilter === 'all'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      All Posts
                    </button>
                    <button
                      onClick={() => setFeedFilter('friends')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        feedFilter === 'friends'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Friends Only
                    </button>
                    <button
                      onClick={() => setFeedFilter('saved')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        feedFilter === 'saved'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Bookmarks
                    </button>
                  </div>

                  <button
                    onClick={loadPosts}
                    title="Refresh feed"
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Post Cards Stream */}
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
                      <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-60" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {feedFilter === 'saved' ? 'No saved posts yet' : 'No posts in this stream'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        {feedFilter === 'saved'
                          ? 'Click the bookmark icon on any post to read it later.'
                          : 'Publish your thoughts above or connect with peers to see their updates.'}
                      </p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onPostUpdated={loadPosts}
                        onOpenProfile={(u) => setProfileModalUser(u)}
                        onReport={(postId) => {
                          setReportTargetId(postId);
                          setModerationModalOpen(true);
                        }}
                      />
                    ))
                  )}
                </div>
              </>
            )}

            {/* Active Tab: Friends & Requests */}
            {activeTab === 'friends' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                    Friends ({friends.length})
                  </h3>
                  {friends.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No friends connected yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {friends.map((f) => (
                        <div
                          key={f.id}
                          className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                        >
                          <div
                            onClick={() => setProfileModalUser(f)}
                            className="flex items-center gap-2.5 cursor-pointer min-w-0"
                          >
                            <img
                              src={f.avatar}
                              alt={f.fullName}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="truncate">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {f.fullName}
                              </h5>
                              <p className="text-[11px] text-slate-500 truncate">@{f.username}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setChatRecipient(f);
                              setChatModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg hover:bg-indigo-100 transition-colors shrink-0"
                          >
                            Message
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active Tab: Communities */}
            {activeTab === 'communities' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    Communities on Subhu
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Join topic-focused spaces built on respectful dialogue and shared goals.
                  </p>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Distributed Systems & Web Architects
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          A global community of engineers discussing resilience, peer-to-peer protocols, and scalable social architectures.
                        </p>
                        <span className="text-[11px] font-mono text-slate-400 mt-2 block">
                          3 active members · Public
                        </span>
                      </div>
                      <button className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white shrink-0">
                        Joined
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Digital Typography & Human Interfaces
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Designers focusing on accessible contrast, zero-pill metadata, and intentional UI rhythm.
                        </p>
                        <span className="text-[11px] font-mono text-slate-400 mt-2 block">
                          2 active members · Public
                        </span>
                      </div>
                      <button className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 shrink-0">
                        Join Community
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Tab: Moderation & Admin */}
            {activeTab === 'moderation' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Community Safety & Operations Center
                    </h3>
                    <p className="text-xs text-slate-500">
                      View pending user flags, resolve violations, and inspect security audit trails.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModerationModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm"
                >
                  Open Moderation Dashboard & Audit Logs
                </button>
              </div>
            )}
          </section>

          {/* Right Column Contacts & Suggested Connections */}
          <RightSidebar
            currentUser={currentUser}
            friends={friends}
            pendingIncoming={pendingIncoming}
            suggestedUsers={suggestedUsers}
            onOpenProfile={(u) => setProfileModalUser(u)}
            onStartChat={(u) => {
              setChatRecipient(u);
              setChatModalOpen(true);
            }}
            onStartCall={(u, type) => {
              setCallModalData({ callee: u, type });
            }}
            onRespondFriendRequest={handleRespondFriendRequest}
            onSendFriendRequest={handleSendFriendRequest}
          />
        </div>
      </main>

      {/* Floating Chat Modal */}
      <ChatModal
        currentUser={currentUser}
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        initialRecipient={chatRecipient}
        onStartCall={(u, type) => {
          setCallModalData({ callee: u, type });
        }}
      />

      {/* WebRTC Calling Modal */}
      {callModalData && (
        <CallModal
          currentUser={currentUser}
          callee={callModalData.callee}
          callType={callModalData.type}
          isIncoming={callModalData.isIncoming}
          onEndCall={() => setCallModalData(null)}
        />
      )}

      {/* User Profile View & Timeline */}
      <ProfileModal
        user={profileModalUser}
        currentUser={currentUser}
        isOpen={!!profileModalUser}
        onClose={() => setProfileModalUser(null)}
        onStartChat={(u) => {
          setChatRecipient(u);
          setChatModalOpen(true);
        }}
        onStartCall={(u, type) => {
          setCallModalData({ callee: u, type });
        }}
        onProfileUpdated={(updated) => {
          if (currentUser && currentUser.id === updated.id) {
            setCurrentUser(updated);
          }
          loadPosts();
        }}
      />

      {/* Moderation & Safety Center */}
      <ModerationModal
        currentUser={currentUser}
        isOpen={moderationModalOpen}
        onClose={() => {
          setModerationModalOpen(false);
          setReportTargetId(null);
        }}
        reportTargetId={reportTargetId}
      />

      {/* Automated In-Engine Test Suite */}
      <TestSuiteModal
        isOpen={testSuiteModalOpen}
        onClose={() => setTestSuiteModalOpen(false)}
      />

      {/* Login / Register Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(u) => {
          setCurrentUser(u);
          loadPosts();
          loadSocialData();
        }}
      />
    </div>
  );
}
