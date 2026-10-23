import React, { useState } from 'react';
import { Post, User, Comment } from '../types/index.js';
import { api } from '../services/api.js';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  MoreHorizontal,
  Trash2,
  Flag,
  Globe,
  Users,
  Lock,
  Send,
  CornerDownRight,
  CheckCircle,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onPostUpdated: () => void;
  onOpenProfile: (user: User) => void;
  onReport: (postId: string) => void;
}

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like', color: 'text-blue-500' },
  { type: 'love', emoji: '❤️', label: 'Love', color: 'text-rose-500' },
  { type: 'haha', emoji: '😆', label: 'Haha', color: 'text-amber-500' },
  { type: 'wow', emoji: '😮', label: 'Wow', color: 'text-amber-500' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'text-yellow-600' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-orange-600' },
];

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onPostUpdated,
  onOpenProfile,
  onReport,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const canDelete =
    currentUser && (currentUser.id === post.authorId || currentUser.role === 'admin');

  const handleReact = async (type: string) => {
    if (!currentUser) return;
    try {
      await api.reactToPost(post.id, type);
      setShowReactionPicker(false);
      onPostUpdated();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState) {
      const res = await api.getComments(post.id);
      setComments(res.comments);
    }
  };

  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const content = parentId ? replyText : newComment;
    if (!content.trim() || !currentUser) return;

    try {
      await api.addComment(post.id, content.trim(), parentId);
      if (parentId) {
        setReplyText('');
        setReplyToId(null);
      } else {
        setNewComment('');
      }
      const res = await api.getComments(post.id);
      setComments(res.comments);
      onPostUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to submit comment');
    }
  };

  const handleToggleSave = async () => {
    if (!currentUser) return;
    try {
      await api.savePost(post.id);
      onPostUpdated();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    try {
      await api.deletePost(post.id);
      onPostUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + `?post=${post.id}`);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const totalReactions = Object.values(post.reactionCounts || {}).reduce((a, b) => a + b, 0);

  const currentReactionObj = REACTIONS.find((r) => r.type === post.userReaction);

  return (
    <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 transition-colors relative">
      {/* Header: Author + Metadata + Dropdown */}
      <div className="flex items-start justify-between gap-3">
        <div
          onClick={() => onOpenProfile(post.author)}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <img
            src={post.author.avatar || '/src/assets/images/avatar_creative_user_1792752821026.jpg'}
            alt={post.author.fullName}
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
            referrerPolicy="no-referrer"
          />
          <div className="truncate">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {post.author.fullName}
              </span>
              {post.author.isVerified && (
                <CheckCircle className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500 text-white shrink-0" />
              )}
              {post.feeling && (
                <span className="text-[11px] text-slate-500 font-normal">
                  is feeling <strong className="font-semibold capitalize text-slate-700 dark:text-slate-300">{post.feeling}</strong>
                </span>
              )}
            </div>

            {/* Clean unboxed metadata */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>@{post.author.username}</span>
              <span aria-hidden="true">·</span>
              <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                {post.audience === 'public' && <Globe className="w-3 h-3 text-slate-400" />}
                {post.audience === 'friends' && <Users className="w-3 h-3 text-blue-400" />}
                {post.audience === 'only_me' && <Lock className="w-3 h-3 text-amber-500" />}
                <span className="capitalize">{post.audience.replace('_', ' ')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Dropdown Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-30">
              {canDelete && (
                <button
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="w-full px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
              )}
              <button
                onClick={() => {
                  onReport(post.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-left"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Content</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <div className="mt-3 text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
        {post.content}
      </div>

      {/* Media Attachments Gallery */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="mt-3.5 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 max-h-96">
          <img
            src={post.mediaUrls[0]}
            alt="Post attachment"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cover_landscape_aurora_1792752820966.jpg';
            }}
          />
        </div>
      )}

      {/* Aggregate Counts Line */}
      {(totalReactions > 0 || post.commentCount > 0) && (
        <div className="mt-3 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            {totalReactions > 0 && (
              <span className="flex items-center gap-1">
                <span>❤️</span>
                <span className="font-mono tabular-nums font-semibold text-slate-600 dark:text-slate-300">
                  {totalReactions}
                </span>
              </span>
            )}
          </div>
          {post.commentCount > 0 && (
            <span
              onClick={handleToggleComments}
              className="hover:underline cursor-pointer font-mono tabular-nums"
            >
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </div>
      )}

      {/* Action Buttons Toolbar */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        
        {/* Like / Reactions trigger */}
        <div
          className="relative"
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
        >
          <button
            onClick={() => handleReact(post.userReaction ? post.userReaction : 'like')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              currentReactionObj
                ? `${currentReactionObj.color} bg-slate-50 dark:bg-slate-800/60`
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            {currentReactionObj ? (
              <span>{currentReactionObj.emoji}</span>
            ) : (
              <Heart className="w-3.5 h-3.5" />
            )}
            <span>{currentReactionObj ? currentReactionObj.label : 'Like'}</span>
          </button>

          {/* Hover Reactions Popup */}
          {showReactionPicker && (
            <div className="absolute bottom-full left-0 mb-2 p-1 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 z-30 animate-in fade-in zoom-in-90">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => handleReact(r.type)}
                  className="w-8 h-8 rounded-full hover:scale-125 transition-transform flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comments Button */}
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Comment</span>
        </button>

        {/* Save Bookmark Button */}
        <button
          onClick={handleToggleSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            post.isSaved
              ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-50/60 dark:bg-amber-950/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${post.isSaved ? 'fill-current' : ''}`} />
          <span>{post.isSaved ? 'Saved' : 'Save'}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedShare ? 'Copied Link!' : 'Share'}</span>
        </button>
      </div>

      {/* Threaded Comments Section */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          
          {/* Add New Comment */}
          {currentUser && (
            <form onSubmit={(e) => handleAddComment(e, null)} className="flex items-center gap-2">
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 disabled:opacity-30"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* List of Comments & Replies */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-2">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-1.5">
                  <div className="flex items-start gap-2.5">
                    <img
                      src={comment.author.avatar || '/src/assets/images/avatar_creative_user_1792752821026.jpg'}
                      alt={comment.author.fullName}
                      className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {comment.author.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                        {comment.content}
                      </p>
                      <button
                        onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Reply Input */}
                  {replyToId === comment.id && currentUser && (
                    <form
                      onSubmit={(e) => handleAddComment(e, comment.id)}
                      className="ml-8 flex items-center gap-2 mt-1"
                    >
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.author.fullName.split(' ')[0]}...`}
                        className="flex-1 px-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-lg disabled:opacity-40"
                      >
                        Reply
                      </button>
                    </form>
                  )}

                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-8 space-y-1.5 border-l-2 border-slate-200 dark:border-slate-800 pl-2.5">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <img
                            src={reply.author.avatar || '/src/assets/images/avatar_creative_user_1792752821026.jpg'}
                            alt={reply.author.fullName}
                            className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                          />
                          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-2 text-xs flex-1">
                            <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                              {reply.author.fullName}
                            </span>
                            <span className="text-slate-700 dark:text-slate-300">{reply.content}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
};
