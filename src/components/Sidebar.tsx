import React from 'react';
import { User } from '../types/index.js';
import {
  Rss,
  Users,
  Bookmark,
  MessageCircle,
  Clock,
  ShieldAlert,
  Sparkles,
  Settings,
  Lock,
  Download,
  CheckCircle,
} from 'lucide-react';

interface SidebarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: (user: User) => void;
  onOpenTestSuite: () => void;
  onOpenChat: () => void;
  feedFilter: 'all' | 'friends' | 'saved';
  setFeedFilter: (f: 'all' | 'friends' | 'saved') => void;
  pendingRequestsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenTestSuite,
  onOpenChat,
  feedFilter,
  setFeedFilter,
  pendingRequestsCount,
}) => {
  if (!currentUser) return null;

  return (
    <aside className="w-64 shrink-0 hidden lg:block space-y-4">
      {/* Current User Snapshot Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 transition-colors">
        <div
          onClick={() => onOpenProfile(currentUser)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.fullName}
            className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500/20 group-hover:border-indigo-500 transition-colors"
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {currentUser.fullName}
              {currentUser.isVerified && <CheckCircle className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500 text-white" />}
            </h3>
            <p className="text-[11px] text-slate-500 truncate">@{currentUser.username}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Role: <strong className="text-slate-800 dark:text-slate-200 capitalize">{currentUser.role}</strong></span>
          <button
            onClick={() => onOpenProfile(currentUser)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            View Profile
          </button>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 space-y-0.5 transition-colors">
        <button
          onClick={() => {
            setActiveTab('feed');
            setFeedFilter('all');
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
            activeTab === 'feed' && feedFilter === 'all'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900'
          }`}
        >
          <Rss className="w-4 h-4 text-indigo-500" />
          <span>Home Feed</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('feed');
            setFeedFilter('friends');
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
            activeTab === 'feed' && feedFilter === 'friends'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-blue-500" />
          <span>Friends-Only Feed</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('feed');
            setFeedFilter('saved');
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
            activeTab === 'feed' && feedFilter === 'saved'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900'
          }`}
        >
          <Bookmark className="w-4 h-4 text-amber-500" />
          <span>Saved Posts</span>
        </button>

        <button
          onClick={() => setActiveTab('friends')}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
            activeTab === 'friends'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-teal-500" />
            <span>Friends & Requests</span>
          </div>
          {pendingRequestsCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenChat}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-sky-500" />
          <span>Direct & Group Chats</span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
            activeTab === 'stories'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-purple-500" />
          <span>24h Stories</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
            activeTab === 'moderation'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>Safety & Reports</span>
        </button>

        <button
          onClick={onOpenTestSuite}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors font-semibold"
        >
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Automated Verification</span>
        </button>
      </div>

      {/* Privacy & Account Trust Safeguards */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-3.5 space-y-2 text-[11px] text-slate-500">
        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-indigo-500" />
          <span>Privacy & Security</span>
        </div>
        <p className="leading-relaxed">
          Posts set to Friends are strictly filtered on the server before leaving the database. You maintain complete ownership of your data.
        </p>
      </div>
    </aside>
  );
};
