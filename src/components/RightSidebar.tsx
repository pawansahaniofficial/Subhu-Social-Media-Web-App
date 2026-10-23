import React from 'react';
import { User } from '../types/index.js';
import {
  MessageCircle,
  Phone,
  Video,
  UserPlus,
  Check,
  X,
  CheckCircle,
} from 'lucide-react';

interface RightSidebarProps {
  currentUser: User | null;
  friends: User[];
  pendingIncoming: any[];
  suggestedUsers: User[];
  onOpenProfile: (user: User) => void;
  onStartChat: (user: User) => void;
  onStartCall: (user: User, type: 'audio' | 'video') => void;
  onRespondFriendRequest: (friendshipId: string, accept: boolean) => void;
  onSendFriendRequest: (userId: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  currentUser,
  friends,
  pendingIncoming,
  suggestedUsers,
  onOpenProfile,
  onStartChat,
  onStartCall,
  onRespondFriendRequest,
  onSendFriendRequest,
}) => {
  if (!currentUser) return null;

  return (
    <aside className="w-72 shrink-0 hidden xl:block space-y-4">
      {/* Pending Friend Requests Widget */}
      {pendingIncoming.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Friend Requests
            </h3>
            <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.2 rounded-full font-mono">
              {pendingIncoming.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingIncoming.map((req) => (
              <div key={req.id} className="flex items-center justify-between gap-2">
                <div
                  onClick={() => onOpenProfile(req.requester)}
                  className="flex items-center gap-2.5 cursor-pointer min-w-0"
                >
                  <img
                    src={req.requester.avatar}
                    alt={req.requester.fullName}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {req.requester.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400">@{req.requester.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onRespondFriendRequest(req.id, true)}
                    className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    title="Accept"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRespondFriendRequest(req.id, false)}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Decline"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Friends & Contacts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Contacts & Calling
          </h3>
          <span className="text-[11px] text-slate-400 font-mono tabular-nums">
            {friends.length} friends
          </span>
        </div>

        {friends.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            No friends connected yet. Discover members below!
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div
                  onClick={() => onOpenProfile(friend)}
                  className="flex items-center gap-2.5 cursor-pointer min-w-0"
                >
                  <div className="relative shrink-0">
                    <img
                      src={friend.avatar}
                      alt={friend.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {friend.fullName}
                      {friend.isVerified && (
                        <CheckCircle className="w-3 h-3 text-indigo-500 fill-indigo-500 text-white" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">Available</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onStartChat(friend)}
                    title="Direct Message"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onStartCall(friend, 'audio')}
                    title="Voice Call"
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onStartCall(friend, 'video')}
                    title="Video Call"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested People to Follow / Add */}
      {suggestedUsers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 transition-colors">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            Suggested People
          </h3>
          <div className="space-y-3">
            {suggestedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-2">
                <div
                  onClick={() => onOpenProfile(user)}
                  className="flex items-center gap-2.5 cursor-pointer min-w-0"
                >
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400">@{user.username}</p>
                  </div>
                </div>

                <button
                  onClick={() => onSendFriendRequest(user.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 transition-colors shrink-0"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
