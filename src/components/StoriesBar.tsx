import React, { useState } from 'react';
import { Story, User } from '../types/index.js';
import { Plus, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { api } from '../services/api.js';

interface StoriesBarProps {
  currentUser: User | null;
  stories: Story[];
  onRefreshStories: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  currentUser,
  stories,
  onRefreshStories,
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoryMedia, setNewStoryMedia] = useState('');
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenStory = async (index: number) => {
    setActiveStoryIndex(index);
    const story = stories[index];
    if (story && !story.hasViewed) {
      await api.markStoryViewed(story.id);
      onRefreshStories();
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryMedia.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createStory(newStoryMedia.trim(), newStoryCaption.trim());
      setShowCreateModal(false);
      setNewStoryMedia('');
      setNewStoryCaption('');
      onRefreshStories();
    } catch (err: any) {
      alert(err.message || 'Failed to create story');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  return (
    <div className="w-full">
      {/* Horizontal Story Cards Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        
        {/* Create Story Button */}
        {currentUser && (
          <div
            onClick={() => setShowCreateModal(true)}
            className="w-28 h-40 sm:w-32 sm:h-48 shrink-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden relative cursor-pointer group shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="h-28 sm:h-34 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            <div className="absolute top-[62%] sm:top-[66%] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md group-hover:bg-indigo-500 transition-colors">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="pb-2 px-1 text-center">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">
                Create Story
              </span>
            </div>
          </div>
        )}

        {/* List of Active Stories */}
        {stories.map((story, idx) => (
          <div
            key={story.id}
            onClick={() => handleOpenStory(idx)}
            className="w-28 h-40 sm:w-32 sm:h-48 shrink-0 rounded-2xl overflow-hidden relative cursor-pointer group shadow-sm hover:shadow-md transition-all border border-slate-200/80 dark:border-slate-800"
          >
            <img
              src={story.mediaUrl}
              alt={story.caption || 'Story'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

            {/* Author Avatar with Story Ring */}
            <div className="absolute top-2.5 left-2.5">
              <div className={`p-0.5 rounded-full ${story.hasViewed ? 'bg-slate-400' : 'bg-gradient-to-tr from-indigo-500 to-rose-500'}`}>
                <img
                  src={story.author.avatar}
                  alt={story.author.fullName}
                  className="w-7 h-7 rounded-full object-cover border-2 border-white dark:border-slate-900"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Caption & Author Name */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
              <p className="text-[11px] font-bold leading-tight truncate drop-shadow-sm">
                {story.author.fullName}
              </p>
              {story.caption && (
                <p className="text-[10px] text-slate-200 truncate mt-0.5 opacity-90">
                  {story.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full h-[620px] rounded-3xl overflow-hidden bg-slate-950 flex flex-col justify-between shadow-2xl border border-slate-800">
            {/* Top Controls & Author */}
            <div className="relative z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
              {/* Progress bar */}
              <div className="w-full h-1 bg-white/30 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-white animate-[pulse_3s_ease-in-out_infinite] w-full" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeStory.author.avatar}
                    alt={activeStory.author.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-white"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white drop-shadow">
                      {activeStory.author.fullName}
                    </h4>
                    <span className="text-[10px] text-slate-300">
                      24h Ephemeral
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStoryIndex(null)}
                  className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Story Image Content */}
            <div className="absolute inset-0 z-0">
              <img
                src={activeStory.mediaUrl}
                alt={activeStory.caption}
                className="w-full h-full object-contain bg-black"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Caption & Bottom Bar */}
            {activeStory.caption && (
              <div className="relative z-10 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-center">
                <p className="text-xs text-white drop-shadow-md font-medium leading-relaxed">
                  {activeStory.caption}
                </p>
              </div>
            )}

            {/* Left / Right Nav buttons */}
            {activeStoryIndex !== null && activeStoryIndex > 0 && (
              <button
                onClick={() => handleOpenStory(activeStoryIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {activeStoryIndex !== null && activeStoryIndex < stories.length - 1 && (
              <button
                onClick={() => handleOpenStory(activeStoryIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create a 24-Hour Story</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photo or Image URL
                </label>
                <input
                  type="url"
                  required
                  value={newStoryMedia}
                  onChange={(e) => setNewStoryMedia(e.target.value)}
                  placeholder="Paste an image URL (e.g. /src/assets/images/...)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  value={newStoryCaption}
                  onChange={(e) => setNewStoryCaption(e.target.value)}
                  placeholder="Share what is happening right now..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              {newStoryMedia && (
                <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <img
                    src={newStoryMedia}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cover_landscape_aurora_1792752820966.jpg';
                    }}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Share to Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
