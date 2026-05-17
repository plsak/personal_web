import { stripInlineTextAlign } from "@/utils/htmlUtils";
import { Calendar, Edit2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { BlogPost } from "../backend";
import {
  useAddBlogPost,
  useDeleteBlogPost,
  useEditBlogPost,
  useGetAllBlogPosts,
  useGetSectionNames,
  useSetSectionName,
} from "../hooks/useQueries";
import UnifiedTextEditor from "./UnifiedTextEditor";

interface BlogSectionProps {
  isAdmin: boolean;
  cardBgStyle?: React.CSSProperties;
}

export default function BlogSection({
  isAdmin,
  cardBgStyle,
}: BlogSectionProps) {
  const { data: blogPosts = [], isLoading } = useGetAllBlogPosts();
  const addBlogPost = useAddBlogPost();
  const editBlogPost = useEditBlogPost();
  const deleteBlogPost = useDeleteBlogPost();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [editPost, setEditPost] = useState({ title: "", content: "" });

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    // Strip HTML to check for actual content
    const titleText = newPost.title.replace(/<[^>]*>/g, "").trim();
    const contentText = newPost.content.replace(/<[^>]*>/g, "").trim();
    if (titleText && contentText) {
      try {
        await addBlogPost.mutateAsync({
          title: newPost.title,
          content: newPost.content,
        });
        setNewPost({ title: "", content: "" });
        setIsAdding(false);
      } catch (error) {
        console.error("Failed to add blog post:", error);
      }
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleText = editPost.title.replace(/<[^>]*>/g, "").trim();
    const contentText = editPost.content.replace(/<[^>]*>/g, "").trim();
    if (editingId !== null && titleText && contentText) {
      try {
        await editBlogPost.mutateAsync({
          id: editingId,
          title: editPost.title,
          content: editPost.content,
        });
        setEditingId(null);
        setEditPost({ title: "", content: "" });
      } catch (error) {
        console.error("Failed to edit blog post:", error);
        // Don't reset state on error so user can retry
      }
    }
  };

  const startEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setEditPost({ title: post.title, content: post.content });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPost({ title: "", content: "" });
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewPost({ title: "", content: "" });
  };

  const handleDelete = async (id: bigint) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      try {
        await deleteBlogPost.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete blog post:", error);
      }
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    });
  };

  // Sort posts by timestamp (newest first)
  const sortedPosts = [...blogPosts].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  const { data: sectionNames } = useGetSectionNames();
  const setSectionName = useSetSectionName();
  const [editingBlogName, setEditingBlogName] = useState(false);
  const [pendingBlogName, setPendingBlogName] = useState("");

  const displayBlogName = sectionNames?.blog ?? "Blog";

  const handleBlogNameClick = () => {
    if (!isAdmin) return;
    setPendingBlogName(displayBlogName);
    setEditingBlogName(true);
  };

  const saveBlogName = async () => {
    const stripped = pendingBlogName.replace(/<[^>]*>/g, "").trim();
    if (stripped) {
      try {
        await setSectionName.mutateAsync({
          section: "blog",
          name: pendingBlogName,
        });
      } catch (e) {
        console.error("Failed to save blog name:", e);
      }
    }
    setEditingBlogName(false);
  };

  const cancelBlogName = () => {
    setEditingBlogName(false);
    setPendingBlogName("");
  };

  return (
    <div
      className="bg-slate-800 rounded-lg p-6 border border-slate-700"
      style={cardBgStyle}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 flex justify-center">
          {editingBlogName ? (
            <div className="flex flex-col items-center gap-2 w-full max-w-xs">
              <UnifiedTextEditor
                value={pendingBlogName}
                onChange={setPendingBlogName}
                placeholder="Section name"
                showFontPicker
                showColorPicker
                minRows={1}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveBlogName}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
                <button
                  type="button"
                  onClick={cancelBlogName}
                  className="flex items-center gap-1 bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded text-xs transition-colors"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <h2
                className={`text-xl font-semibold text-slate-100 rich-text-content ${isAdmin ? "cursor-pointer hover:text-blue-300 transition-colors" : ""}`}
                onClick={handleBlogNameClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleBlogNameClick();
                }}
                role={isAdmin ? "button" : undefined}
                tabIndex={isAdmin ? 0 : undefined}
                title={isAdmin ? "Click to rename" : undefined}
                // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-controlled section name
                dangerouslySetInnerHTML={{
                  __html: stripInlineTextAlign(displayBlogName),
                }}
              />
              {isAdmin && (
                <Pencil
                  className="w-3 h-3 text-slate-500 hover:text-blue-400 cursor-pointer transition-colors"
                  onClick={handleBlogNameClick}
                />
              )}
            </div>
          )}
        </div>
        {isAdmin && (
          <button
            type="button"
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
        <form
          onSubmit={handleAddPost}
          className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600 space-y-3"
        >
          <div>
            <span className="block text-xs font-medium text-slate-400 mb-1">
              Post Title
            </span>
            <UnifiedTextEditor
              value={newPost.title}
              onChange={(val) => setNewPost((p) => ({ ...p, title: val }))}
              placeholder="Post title"
              showFontPicker
              showColorPicker
              minRows={1}
            />
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-400 mb-1">
              Post Content
            </span>
            <UnifiedTextEditor
              value={newPost.content}
              onChange={(val) => setNewPost((p) => ({ ...p, content: val }))}
              placeholder="Post content"
              showFontPicker
              showColorPicker
              minRows={4}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addBlogPost.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-2 rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              {addBlogPost.isPending ? "Saving..." : "Save"}
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
          <div className="text-center py-8 text-slate-400">
            Loading blog posts...
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No blog posts yet.
          </div>
        ) : (
          sortedPosts.map((post) => (
            <div
              key={post.id.toString()}
              className="bg-slate-700 rounded-lg p-4 border border-slate-600"
            >
              {editingId === post.id ? (
                <form onSubmit={handleEditPost} className="space-y-3">
                  <div>
                    <span className="block text-xs font-medium text-slate-400 mb-1">
                      Post Title
                    </span>
                    <UnifiedTextEditor
                      value={editPost.title}
                      onChange={(val) =>
                        setEditPost((p) => ({ ...p, title: val }))
                      }
                      placeholder="Post title"
                      showFontPicker
                      showColorPicker
                      minRows={1}
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-400 mb-1">
                      Post Content
                    </span>
                    <UnifiedTextEditor
                      value={editPost.content}
                      onChange={(val) =>
                        setEditPost((p) => ({ ...p, content: val }))
                      }
                      placeholder="Post content"
                      showFontPicker
                      showColorPicker
                      minRows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={editBlogPost.isPending}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-2 rounded transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      {editBlogPost.isPending ? "Saving..." : "Save Changes"}
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
                      className="blog-title text-lg font-medium text-slate-100 emoji-support rich-text-content"
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: blog title is admin-controlled rich text
                      dangerouslySetInnerHTML={{
                        __html: stripInlineTextAlign(post.title),
                      }}
                    />
                    {isAdmin && (
                      <div className="flex gap-1 ml-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(post)}
                          className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                          title="Edit post"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
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
                    className="blog-content text-slate-300 mb-3 emoji-support rich-text-content"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: blog content is admin-controlled rich text
                    dangerouslySetInnerHTML={{
                      __html: stripInlineTextAlign(post.content),
                    }}
                  />
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
