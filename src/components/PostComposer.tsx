import React, { useState } from 'react';
import { User, Audience } from '../types/index.js';
import { api } from '../services/api.js';
import {
  Image,
  Smile,
  Globe,
  Users,
  Lock,
  Send,
  X,
  MapPin,
  CheckCircle,
} from 'lucide-react';

interface PostComposerProps {
  currentUser: User | null;
  onPostCreated: () => void;
  onOpenAuth: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  currentUser,
  onPostCreated,
  onOpenAuth,
}) => {
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<Audience>('public');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [feeling, setFeeling] = useState<string>('');
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 text-center transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Join the conversation on Subhu
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Share your ideas, connect with verified peers, and enjoy true privacy controls.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm"
        >
          Sign in to Post
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createPost({
        content: content.trim(),
        mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
        audience,
        feeling: feeling || undefined,
      });
      setContent('');
      setMediaUrl('');
      setShowMediaInput(false);
      setFeeling('');
      setShowFeelingPicker(false);
      onPostCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const feelings = [
    { label: 'excited', emoji: '🚀' },
    { label: 'celebrating', emoji: '🎉' },
    { label: 'inspired', emoji: '✨' },
    { label: 'thinking', emoji: '💡' },
    { label: 'productive', emoji: '💻' },
    { label: 'grateful', emoji: '🙏' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 transition-colors">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Top Header: Avatar + Audience Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={currentUser.avatar}
              alt={currentUser.fullName}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {currentUser.fullName}
              </span>
              {feeling && (
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 capitalize">
                  Feeling {feeling}
                </span>
              )}
            </div>
          </div>

          {/* Privacy Audience Dropdown */}
          <div className="relative">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as Audience)}
              className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 cursor-pointer outline-none"
            >
              <option value="public">🌐 Public</option>
              <option value="friends">👥 Friends Only</option>
              <option value="only_me">🔒 Only Me</option>
            </select>
          </div>
        </div>

        {/* Text Input Area */}
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${currentUser.fullName.split(' ')[0]}?`}
          className="w-full text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent resize-none outline-none leading-relaxed"
        />

        {/* Media Preview / Input */}
        {showMediaInput && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Attach Image URL
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowMediaInput(false);
                  setMediaUrl('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg or /src/assets/images/..."
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
            {mediaUrl && (
              <div className="h-32 w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 relative">
                <img
                  src={mediaUrl}
                  alt="Attachment preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cover_landscape_aurora_1792752820966.jpg';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Feeling Picker */}
        {showFeelingPicker && (
          <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex items-center gap-1.5 overflow-x-auto">
            {feelings.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  setFeeling(feeling === f.label ? '' : f.label);
                  setShowFeelingPicker(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors shrink-0 ${
                  feeling === f.label
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="mr-1">{f.emoji}</span>
                <span className="capitalize">{f.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Footer Toolbar & Publish CTA */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowMediaInput(!showMediaInput)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Image className="w-3.5 h-3.5 text-emerald-500" />
              <span>Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFeelingPicker(!showFeelingPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Smile className="w-3.5 h-3.5 text-amber-500" />
              <span>Feeling</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !mediaUrl.trim())}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
          >
            <Send className="w-3 h-3" />
            <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
