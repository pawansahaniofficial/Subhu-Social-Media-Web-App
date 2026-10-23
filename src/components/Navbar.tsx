import React, { useState, useEffect, useRef } from 'react';
import { User, Notification } from '../types/index.js';
import { api } from '../services/api.js';
import {
  Bell,
  MessageSquare,
  Search,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle,
  Menu,
  X,
  LogOut,
  Users,
  Compass,
  Radio,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenProfile: (user: User) => void;
  unreadMessagesCount: number;
  onOpenChat: () => void;
  onOpenTestSuite: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  onOpenProfile,
  unreadMessagesCount,
  onOpenChat,
  onOpenTestSuite,
  darkMode,
  setDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ users: User[]; posts: any[] } | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications periodically if logged in
  useEffect(() => {
    if (!currentUser) return;

    const loadNotifications = async () => {
      try {
        const res = await api.getNotifications();
        setNotifications(res.notifications);
        setUnreadNotifsCount(res.unreadCount);
      } catch (e) {
        // quiet
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle Search Input
  useEffect(() => {
    if (!searchQuery.trim() || !currentUser) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.search(searchQuery);
        setSearchResults(res.results);
        setShowSearchDropdown(true);
      } catch (e) {
        // ignore
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllNotifsRead = async () => {
    await api.markAllNotificationsRead();
    setUnreadNotifsCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 md:gap-8 h-16">
          
          {/* Zone 1: Subhu Brand Wordmark & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('feed')}
              className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1 group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center shadow-sm shadow-indigo-500/20 text-white font-black text-xl tracking-tighter">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  Subhu
                </span>
              </div>
            </button>

            {/* Quick Global Search Bar */}
            {currentUser && (
              <div className="relative hidden md:block w-56 lg:w-72" ref={searchRef}>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowSearchDropdown(true)}
                    placeholder="Search people, posts..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all outline-none"
                  />
                </div>

                {/* Search Dropdown */}
                {showSearchDropdown && searchResults && (
                  <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 overflow-hidden">
                    <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      People
                    </div>
                    {searchResults.users.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500">No users found</div>
                    ) : (
                      searchResults.users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            onOpenProfile(u);
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition-colors"
                        >
                          <img
                            src={u.avatar}
                            alt={u.fullName}
                            className="w-7 h-7 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="truncate">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                              {u.fullName}
                              {u.isVerified && <CheckCircle className="w-3 h-3 text-indigo-500 fill-indigo-500 text-white" />}
                            </div>
                            <div className="text-[11px] text-slate-500">@{u.username}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone 2: Navigation Links (Clean single-line labels) */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'feed'
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'friends'
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                Friends
              </button>
              <button
                onClick={() => setActiveTab('stories')}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'stories'
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                Stories
              </button>
              <button
                onClick={() => setActiveTab('communities')}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'communities'
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                Communities
              </button>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('moderation')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'moderation'
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Safety & Admin
                </button>
              )}
            </nav>
          )}

          {/* Zone 3: Primary Actions & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Test Suite Button */}
            <button
              onClick={onOpenTestSuite}
              title="Run Automated Verification Tests"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Test Engine</span>
            </button>

            {currentUser ? (
              <>
                {/* Chat Drawer Toggle */}
                <button
                  onClick={onOpenChat}
                  aria-label="Open messages"
                  className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center font-mono tabular-nums">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    aria-label="Notifications"
                    className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifsCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center font-mono tabular-nums">
                        {unreadNotifsCount}
                      </span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-3 z-50">
                      <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                        {unreadNotifsCount > 0 && (
                          <button
                            onClick={handleMarkAllNotifsRead}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/40">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">No notifications yet.</div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 text-xs flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${
                                !notif.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
                                {notif.sender?.avatar ? (
                                  <img
                                    src={notif.sender.avatar}
                                    alt={notif.sender.fullName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                    S
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-slate-800 dark:text-slate-200 leading-snug">{notif.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Current User Avatar & Profile trigger */}
                <button
                  onClick={() => onOpenProfile(currentUser)}
                  className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.fullName}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <span className="hidden xl:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {currentUser.fullName}
                  </span>
                </button>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                  Join Subhu
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            {currentUser && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && currentUser && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          <button
            onClick={() => {
              setActiveTab('feed');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-800 dark:text-slate-200"
          >
            Feed
          </button>
          <button
            onClick={() => {
              setActiveTab('friends');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-800 dark:text-slate-200"
          >
            Friends & Requests
          </button>
          <button
            onClick={() => {
              setActiveTab('stories');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-800 dark:text-slate-200"
          >
            Stories
          </button>
          <button
            onClick={() => {
              setActiveTab('communities');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-800 dark:text-slate-200"
          >
            Communities
          </button>
          <button
            onClick={() => {
              onOpenTestSuite();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 font-semibold"
          >
            Run Automated Test Suite
          </button>
        </div>
      )}
    </header>
  );
};
