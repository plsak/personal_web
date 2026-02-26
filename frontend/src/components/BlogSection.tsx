import React, { useState } from 'react';
import { useGetAllBlogPosts, useAddBlogPost, useEditBlogPost, useDeleteBlogPost } from '../hooks/useQueries';
import { BlogPost } from '../backend';
import { Plus, Edit2, Trash2, Save, X, Calendar, Smile } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

interface BlogSectionProps {
  isAdmin: boolean;
}

export default function BlogSection({ isAdmin }: BlogSectionProps) {
  const { data: blogPosts = [], isLoading } = useGetAllBlogPosts();
  const addBlogPost = useAddBlogPost();
  const editBlogPost = useEditBlogPost();
  const deleteBlogPost = useDeleteBlogPost();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [editPost, setEditPost] = useState({ title: '', content: '' });
  
  // Emoji picker states
  const [showTitleEmojiPicker, setShowTitleEmojiPicker] = useState(false);
  const [showContentEmojiPicker, setShowContentEmojiPicker] = useState(false);
  const [showEditTitleEmojiPicker, setShowEditTitleEmojiPicker] = useState(false);
  const [showEditContentEmojiPicker, setShowEditContentEmojiPicker] = useState(false);

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.title.trim() && newPost.content.trim()) {
      try {
        await addBlogPost.mutateAsync({
          title: newPost.title.trim(),
          content: newPost.content.trim()
        });
        setNewPost({ title: '', content: '' });
        setIsAdding(false);
        setShowTitleEmojiPicker(false);
        setShowContentEmojiPicker(false);
      } catch (error) {
        console.error('Failed to add blog post:', error);
      }
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId !== null && editPost.title.trim() && editPost.content.trim()) {
      try {
        await editBlogPost.mutateAsync({
          id: editingId,
          title: editPost.title.trim(),
          content: editPost.content.trim()
        });
        // Reset editing state after successful save
        setEditingId(null);
        setEditPost({ title: '', content: '' });
        setShowEditTitleEmojiPicker(false);
        setShowEditContentEmojiPicker(false);
      } catch (error) {
        console.error('Failed to edit blog post:', error);
        // Don't reset state on error so user can retry
      }
    }
  };

  const startEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setEditPost({ title: post.title, content: post.content });
    // Close any open emoji pickers
    setShowEditTitleEmojiPicker(false);
    setShowEditContentEmojiPicker(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPost({ title: '', content: '' });
    setShowEditTitleEmojiPicker(false);
    setShowEditContentEmojiPicker(false);
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewPost({ title: '', content: '' });
    setShowTitleEmojiPicker(false);
    setShowContentEmojiPicker(false);
  };

  const handleDelete = async (id: bigint) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await deleteBlogPost.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete blog post:', error);
      }
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short'
    });
  };

  // Emoji insertion handlers for new post
  const handleTitleEmojiSelect = (emoji: string) => {
    setNewPost(prev => ({ ...prev, title: prev.title + emoji }));
    setShowTitleEmojiPicker(false);
  };

  const handleContentEmojiSelect = (emoji: string) => {
    setNewPost(prev => ({ ...prev, content: prev.content + emoji }));
    setShowContentEmojiPicker(false);
  };

  // Emoji insertion handlers for edit post
  const handleEditTitleEmojiSelect = (emoji: string) => {
    setEditPost(prev => ({ ...prev, title: prev.title + emoji }));
    setShowEditTitleEmojiPicker(false);
  };

  const handleEditContentEmojiSelect = (emoji: string) => {
    setEditPost(prev => ({ ...prev, content: prev.content + emoji }));
    setShowEditContentEmojiPicker(false);
  };

  // Sort posts by timestamp (newest first)
  const sortedPosts = [...blogPosts].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 flex justify-center">
          <h2 className="text-xl font-semibold text-slate-100">Blog</h2>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        )}
      </div>

      {/* Add New Post Form */}
      {isAdmin && isAdding && (
        <form onSubmit={handleAddPost} className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Post title"
                className="blog-input w-full px-3 py-2 pr-10 bg-slate-600 border border-slate-500 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 emoji-support"
                required
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '1rem',
                  fontWeight: '400',
                  letterSpacing: '0',
                  wordSpacing: '0',
                  lineHeight: '1.5'
                }}
              />
              <button
                type="button"
                onClick={() => setShowTitleEmojiPicker(!showTitleEmojiPicker)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              {showTitleEmojiPicker && (
                <div className="absolute top-full right-0 mt-1 z-50">
                  <EmojiPicker
                    onEmojiSelect={handleTitleEmojiSelect}
                    onClose={() => setShowTitleEmojiPicker(false)}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="mb-3">
            <div className="relative">
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="Post content"
                rows={4}
                className="blog-textarea w-full px-3 py-2 pr-10 bg-slate-600 border border-slate-500 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none emoji-support"
                required
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '1rem',
                  fontWeight: '400',
                  letterSpacing: '0',
                  wordSpacing: '0',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              />
              <button
                type="button"
                onClick={() => setShowContentEmojiPicker(!showContentEmojiPicker)}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 transition-colors"
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              {showContentEmojiPicker && (
                <div className="absolute top-full right-0 mt-1 z-50">
                  <EmojiPicker
                    onEmojiSelect={handleContentEmojiSelect}
                    onClose={() => setShowContentEmojiPicker(false)}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addBlogPost.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-2 rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              {addBlogPost.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelAdd}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Blog Posts */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Loading blog posts...</div>
        ) : sortedPosts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No blog posts yet.</div>
        ) : (
          sortedPosts.map((post) => (
            <div key={post.id.toString()} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
              {editingId === post.id ? (
                <form onSubmit={handleEditPost} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={editPost.title}
                      onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                      className="blog-input w-full px-3 py-2 pr-10 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 emoji-support"
                      required
                      placeholder="Post title"
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '1rem',
                        fontWeight: '400',
                        letterSpacing: '0',
                        wordSpacing: '0',
                        lineHeight: '1.5'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditTitleEmojiPicker(!showEditTitleEmojiPicker)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Add emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    {showEditTitleEmojiPicker && (
                      <div className="absolute top-full right-0 mt-1 z-50">
                        <EmojiPicker
                          onEmojiSelect={handleEditTitleEmojiSelect}
                          onClose={() => setShowEditTitleEmojiPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      value={editPost.content}
                      onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                      rows={4}
                      className="blog-textarea w-full px-3 py-2 pr-10 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none emoji-support"
                      required
                      placeholder="Post content"
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '1rem',
                        fontWeight: '400',
                        letterSpacing: '0',
                        wordSpacing: '0',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditContentEmojiPicker(!showEditContentEmojiPicker)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Add emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    {showEditContentEmojiPicker && (
                      <div className="absolute top-full right-0 mt-1 z-50">
                        <EmojiPicker
                          onEmojiSelect={handleEditContentEmojiSelect}
                          onClose={() => setShowEditContentEmojiPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={editBlogPost.isPending}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-2 rounded transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      {editBlogPost.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <h3 
                      className="blog-title text-lg font-medium text-slate-100 emoji-support"
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '1.125rem',
                        fontWeight: '500',
                        letterSpacing: '0',
                        wordSpacing: '0',
                        lineHeight: '1.4'
                      }}
                    >
                      {post.title}
                    </h3>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(post)}
                          className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                          title="Edit post"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div 
                    className="blog-content text-slate-300 mb-3 emoji-support"
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.875rem',
                      fontWeight: '400',
                      letterSpacing: '0',
                      wordSpacing: '0',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {post.content}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(post.timestamp)}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
