import React, { useState, useEffect } from 'react';
import { User, Post } from '../types/index.js';
import { api } from '../services/api.js';
import { PostCard } from './PostCard.js';
import {
  X,
  MapPin,
  Globe,
  Calendar,
  UserCheck,
  UserPlus,
  MessageCircle,
  Phone,
  Edit3,
  CheckCircle,
} from 'lucide-react';

interface ProfileModalProps {
  user: User | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (user: User) => void;
  onStartCall: (user: User, type: 'audio' | 'video') => void;
  onProfileUpdated?: (updated: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  currentUser,
  isOpen,
  onClose,
  onStartChat,
  onStartCall,
  onProfileUpdated,
}) => {
  const [profileData, setProfileData] = useState<(User & {
    friendsCount: number;
    postsCount: number;
    friendshipStatus: string;
    isRequester: boolean;
    areFriends: boolean;
  }) | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');

  useEffect(() => {
    if (!isOpen || !user) return;

    const loadProfile = async () => {
      try {
        const res = await api.getUserProfile(user.username);
        setProfileData(res.profile);
        setPosts(res.posts);
        setEditFullName(res.profile.fullName);
        setEditBio(res.profile.bio);
        setEditLocation(res.profile.location || '');
        setEditWebsite(res.profile.website || '');
      } catch (e) {
        console.error(e);
      }
    };

    loadProfile();
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const isMe = currentUser && currentUser.id === user.id;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateProfile({
        fullName: editFullName,
        bio: editBio,
        location: editLocation,
        website: editWebsite,
      });
      setIsEditing(false);
      if (profileData) {
        setProfileData({ ...profileData, ...res.user });
      }
      if (onProfileUpdated) {
        onProfileUpdated(res.user);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleFriendAction = async () => {
    if (!profileData || isMe) return;
    try {
      if (profileData.friendshipStatus === 'none') {
        await api.sendFriendRequest(profileData.id);
        setProfileData({ ...profileData, friendshipStatus: 'pending', isRequester: true });
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in zoom-in-95">
        
        {/* Cover Photo */}
        <div className="h-44 sm:h-56 w-full relative bg-slate-800">
          <img
            src={profileData?.coverPhoto || '/src/assets/images/cover_landscape_aurora_1792752820966.jpg'}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cover_landscape_aurora_1792752820966.jpg';
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <img
                src={profileData?.avatar || user.avatar}
                alt={user.fullName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="mb-1">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {profileData?.fullName || user.fullName}
                  </h2>
                  {(profileData?.isVerified || user.isVerified) && (
                    <CheckCircle className="w-4 h-4 text-indigo-500 fill-indigo-500 text-white" />
                  )}
                </div>
                <p className="text-xs text-slate-500">@{profileData?.username || user.username}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isMe ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFriendAction}
                    disabled={profileData?.friendshipStatus !== 'none'}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                      profileData?.areFriends
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : profileData?.friendshipStatus === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-bold'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    }`}
                  >
                    {profileData?.areFriends ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Friends</span>
                      </>
                    ) : profileData?.friendshipStatus === 'pending' ? (
                      <span>Request Sent</span>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Friend</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onStartChat(user);
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                    title="Send Message"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onStartCall(user, 'audio');
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                    title="Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="mt-6 space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Bio & Details */}
              <p className="mt-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl">
                {profileData?.bio || user.bio}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {(profileData?.location || user.location) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{profileData?.location || user.location}</span>
                  </span>
                )}
                {(profileData?.website || user.website) && (
                  <a
                    href={profileData?.website || user.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{profileData?.website || user.website}</span>
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </span>
              </div>

              {/* Statistics Strip */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6 text-xs">
                <div>
                  <strong className="font-mono tabular-nums text-slate-900 dark:text-white font-bold text-sm">
                    {profileData?.postsCount || posts.length}
                  </strong>{' '}
                  <span className="text-slate-500">Posts</span>
                </div>
                <div>
                  <strong className="font-mono tabular-nums text-slate-900 dark:text-white font-bold text-sm">
                    {profileData?.friendsCount || 0}
                  </strong>{' '}
                  <span className="text-slate-500">Friends</span>
                </div>
              </div>
            </>
          )}

          {/* User's Timeline Posts */}
          <div className="mt-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Timeline Posts
            </h3>
            {posts.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No posts to display.</p>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onPostUpdated={() => {}}
                  onOpenProfile={() => {}}
                  onReport={() => {}}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
