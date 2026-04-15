import { Coffee, Edit2, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { CaffeineInfoScreenRecord } from "../backend";
import {
  useGetCaffeineInfo,
  useGetCaffeineInfoConfig,
  useUpdateCaffeineInfo,
  useUpdateCaffeineInfoConfig,
} from "../hooks/useQueries";

interface LocalScreen {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface CaffeineInfoSectionProps {
  isAdmin: boolean;
}

const DEFAULT_SECTION_TITLE = "About Caffeine AI";

const defaultScreens: LocalScreen[] = [
  {
    id: "default-0",
    title: "AI-Powered Development",
    content:
      "Caffeine is an advanced AI system designed to accelerate software development. It understands code patterns, generates intelligent solutions, and helps developers build applications faster than ever before.",
    order: 0,
  },
  {
    id: "default-1",
    title: "Smart Code Generation",
    content:
      "With deep understanding of programming languages and frameworks, Caffeine can generate complete applications, components, and functions based on natural language descriptions and requirements.",
    order: 1,
  },
  {
    id: "default-2",
    title: "Intelligent Problem Solving",
    content:
      "Caffeine analyzes complex technical challenges and provides optimized solutions. It can debug code, suggest improvements, and implement best practices automatically.",
    order: 2,
  },
  {
    id: "default-3",
    title: "Multi-Language Support",
    content:
      "Supporting dozens of programming languages and frameworks, Caffeine adapts to your tech stack. From React and TypeScript to Python and Rust, it speaks your language.",
    order: 3,
  },
  {
    id: "default-4",
    title: "Real-Time Collaboration",
    content:
      "Work alongside Caffeine as your AI pair programmer. It understands context, maintains code consistency, and helps you iterate quickly on ideas and implementations.",
    order: 4,
  },
];

function toLocalScreens(records: CaffeineInfoScreenRecord[]): LocalScreen[] {
  return [...records]
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      order: Number(r.order),
    }));
}

function toBackendScreens(screens: LocalScreen[]): CaffeineInfoScreenRecord[] {
  return screens.map((s, idx) => ({
    id: s.id,
    title: s.title,
    content: s.content,
    order: BigInt(idx),
  }));
}

export default function CaffeineInfoSection({
  isAdmin,
}: CaffeineInfoSectionProps) {
  const { data: legacyCaffeineInfo, isLoading: legacyLoading } =
    useGetCaffeineInfo();
  const updateCaffeineInfo = useUpdateCaffeineInfo();

  const { data: configData, isLoading: configLoading } =
    useGetCaffeineInfoConfig();
  const updateConfig = useUpdateCaffeineInfoConfig();

  const [isEditing, setIsEditing] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [currentInfoIndex, setCurrentInfoIndex] = useState(0);
  const [isRotationPaused, setIsRotationPaused] = useState(false);

  // Local edit state (populated when entering manage mode)
  const [editSectionTitle, setEditSectionTitle] = useState(
    DEFAULT_SECTION_TITLE,
  );
  const [editScreens, setEditScreens] = useState<LocalScreen[]>(defaultScreens);
  const [editingTitleMode, setEditingTitleMode] = useState(false);
  const [pendingTitle, setPendingTitle] = useState("");
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [editScreenData, setEditScreenData] = useState({
    title: "",
    content: "",
  });
  const [isAddingScreen, setIsAddingScreen] = useState(false);
  const [newScreen, setNewScreen] = useState({ title: "", content: "" });
  const [saveError, setSaveError] = useState<string | null>(null);

  // Legacy editing state
  const [editContent, setEditContent] = useState("");

  // Derive display data from backend (for non-editing view)
  const displaySectionTitle = configData?.sectionTitle ?? DEFAULT_SECTION_TITLE;
  const displayScreens =
    configData && configData.screens.length > 0
      ? toLocalScreens(configData.screens)
      : defaultScreens;

  // Determine if we should use legacy mode (single content) or enhanced mode
  const useLegacyMode =
    legacyCaffeineInfo !== null && legacyCaffeineInfo !== undefined;

  const isLoading = legacyLoading || configLoading;

  // Auto-rotate screens
  useEffect(() => {
    if (
      !useLegacyMode &&
      !isRotationPaused &&
      displayScreens.length > 0 &&
      !isEditing &&
      !isManaging
    ) {
      const interval = setInterval(() => {
        setCurrentInfoIndex((prev) => (prev + 1) % displayScreens.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [
    useLegacyMode,
    isRotationPaused,
    displayScreens.length,
    isEditing,
    isManaging,
  ]);

  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      isRotationPaused &&
      !useLegacyMode &&
      !isEditing &&
      !isManaging &&
      displayScreens.length > 0
    ) {
      setCurrentInfoIndex((prev) => (prev + 1) % displayScreens.length);
    }
  };

  const handleProgressClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!useLegacyMode && !isEditing && !isManaging) {
      setIsRotationPaused(true);
      setCurrentInfoIndex(index);
    }
  };

  // Legacy editing functions
  const startLegacyEdit = () => {
    if (!isAdmin) return;
    setEditContent(legacyCaffeineInfo?.content || "");
    setIsEditing(true);
  };

  const cancelLegacyEdit = () => {
    setIsEditing(false);
    setEditContent("");
  };

  const handleLegacySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editContent.trim()) {
      try {
        await updateCaffeineInfo.mutateAsync(editContent.trim());
        setIsEditing(false);
        setEditContent("");
      } catch (error) {
        console.error("Failed to update caffeine info:", error);
      }
    }
  };

  // Enhanced management functions
  const startManaging = () => {
    if (!isAdmin) return;
    // Populate edit state from current backend data
    setEditSectionTitle(displaySectionTitle);
    setEditScreens(displayScreens);
    setSaveError(null);
    setEditingTitleMode(false);
    setEditingScreenId(null);
    setIsAddingScreen(false);
    setNewScreen({ title: "", content: "" });
    setEditScreenData({ title: "", content: "" });
    setIsManaging(true);
  };

  const cancelManaging = () => {
    setIsManaging(false);
    setEditingTitleMode(false);
    setEditingScreenId(null);
    setIsAddingScreen(false);
    setPendingTitle("");
    setNewScreen({ title: "", content: "" });
    setEditScreenData({ title: "", content: "" });
    setSaveError(null);
  };

  const handleUpdateSectionTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingTitle.trim()) {
      setEditSectionTitle(pendingTitle.trim());
      setEditingTitleMode(false);
    }
  };

  const handleAddScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (newScreen.title.trim() && newScreen.content.trim()) {
      const screen: LocalScreen = {
        id: `new-${Date.now()}`,
        title: newScreen.title.trim(),
        content: newScreen.content.trim(),
        order: editScreens.length,
      };
      setEditScreens([...editScreens, screen]);
      setNewScreen({ title: "", content: "" });
      setIsAddingScreen(false);
    }
  };

  const startEditScreen = (screen: LocalScreen) => {
    setEditingScreenId(screen.id);
    setEditScreenData({ title: screen.title, content: screen.content });
  };

  const handleEditScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      editingScreenId !== null &&
      editScreenData.title.trim() &&
      editScreenData.content.trim()
    ) {
      setEditScreens(
        editScreens.map((s) =>
          s.id === editingScreenId
            ? {
                ...s,
                title: editScreenData.title.trim(),
                content: editScreenData.content.trim(),
              }
            : s,
        ),
      );
      setEditingScreenId(null);
      setEditScreenData({ title: "", content: "" });
    }
  };

  const handleDeleteScreen = (id: string) => {
    if (window.confirm("Are you sure you want to delete this screen?")) {
      const updated = editScreens.filter((s) => s.id !== id);
      setEditScreens(updated);
      if (currentInfoIndex >= updated.length) {
        setCurrentInfoIndex(0);
      }
    }
  };

  // Save all changes to backend
  const handleSaveAll = async () => {
    setSaveError(null);
    try {
      await updateConfig.mutateAsync({
        sectionTitle: editSectionTitle,
        screens: toBackendScreens(editScreens),
      });
      setIsManaging(false);
    } catch (err) {
      console.error("Failed to save about section:", err);
      setSaveError("Failed to save changes. Please try again.");
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
    });
  };

  const currentScreen = displayScreens[currentInfoIndex] || displayScreens[0];

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Coffee className="w-6 h-6 text-orange-400" />
              <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100">
              {isManaging ? editSectionTitle : displaySectionTitle}
            </h2>
          </div>
        </div>
        {isAdmin && !isEditing && !isManaging && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (useLegacyMode) {
                startLegacyEdit();
              } else {
                startManaging();
              }
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">
          Loading about section...
        </div>
      ) : isManaging ? (
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="space-y-6"
        >
          {/* Section Title Management */}
          <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
            <h3 className="text-lg font-medium text-slate-100 mb-3">
              Section Title
            </h3>
            {editingTitleMode ? (
              <form onSubmit={handleUpdateSectionTitle} className="flex gap-2">
                <input
                  type="text"
                  value={pendingTitle}
                  onChange={(e) => setPendingTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Set
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTitleMode(false)}
                  className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{editSectionTitle}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPendingTitle(editSectionTitle);
                    setEditingTitleMode(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Title
                </button>
              </div>
            )}
          </div>

          {/* Screens Management */}
          <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-100">
                Information Screens
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingScreen(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Screen
              </button>
            </div>

            {/* Add New Screen Form */}
            {isAddingScreen && (
              <form
                onSubmit={handleAddScreen}
                className="mb-4 p-4 bg-slate-600 rounded border border-slate-500"
              >
                <div className="mb-3">
                  <input
                    type="text"
                    value={newScreen.title}
                    onChange={(e) =>
                      setNewScreen({ ...newScreen, title: e.target.value })
                    }
                    placeholder="Screen title"
                    className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-3">
                  <textarea
                    value={newScreen.content}
                    onChange={(e) =>
                      setNewScreen({ ...newScreen, content: e.target.value })
                    }
                    placeholder="Screen content"
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingScreen(false);
                      setNewScreen({ title: "", content: "" });
                    }}
                    className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Existing Screens */}
            <div className="space-y-3">
              {editScreens.map((screen: LocalScreen, index: number) => (
                <div
                  key={screen.id}
                  className="p-3 bg-slate-600 rounded border border-slate-500"
                >
                  {editingScreenId === screen.id ? (
                    <form onSubmit={handleEditScreen}>
                      <div className="mb-3">
                        <input
                          type="text"
                          value={editScreenData.title}
                          onChange={(e) =>
                            setEditScreenData({
                              ...editScreenData,
                              title: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <textarea
                          value={editScreenData.content}
                          onChange={(e) =>
                            setEditScreenData({
                              ...editScreenData,
                              content: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors text-sm"
                        >
                          <Save className="w-3 h-3" />
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingScreenId(null);
                            setEditScreenData({ title: "", content: "" });
                          }}
                          className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded transition-colors text-sm"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-100 mb-1">
                            {screen.title}
                          </h4>
                          <p className="text-slate-300 text-sm line-clamp-2">
                            {screen.content}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => startEditScreen(screen)}
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {editScreens.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteScreen(screen.id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        Screen {index + 1} of {editScreens.length}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save error */}
          {saveError && (
            <div className="text-red-400 text-sm px-1">{saveError}</div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={updateConfig.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              {updateConfig.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={cancelManaging}
              disabled={updateConfig.isPending}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : isEditing && useLegacyMode ? (
        <form
          onSubmit={handleLegacySave}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="mb-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Enter information about Caffeine..."
              rows={8}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updateCaffeineInfo.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-2 rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              {updateCaffeineInfo.isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelLegacyEdit}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      ) : useLegacyMode ? (
        <div>
          <div
            className="text-slate-300 whitespace-pre-wrap mb-4 p-2 rounded transition-colors select-none"
            onClick={handleTextClick}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                handleTextClick(e as unknown as React.MouseEvent);
            }}
          >
            {legacyCaffeineInfo.content}
          </div>
          <div className="text-sm text-slate-400">
            Last updated: {formatDate(legacyCaffeineInfo.lastUpdated)}
          </div>
        </div>
      ) : (
        <div className="transition-all duration-500 ease-in-out">
          <div className="mb-4">
            {currentScreen && (
              <>
                <h3 className="text-lg font-semibold text-blue-400 mb-2 flex items-center gap-2 select-none">
                  <Sparkles className="w-5 h-5" />
                  {currentScreen.title}
                </h3>
                <p
                  className={`text-slate-300 leading-relaxed select-none ${
                    isRotationPaused
                      ? "cursor-pointer hover:bg-slate-700 p-2 rounded transition-colors"
                      : ""
                  }`}
                  onClick={handleTextClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleTextClick(e as unknown as React.MouseEvent);
                  }}
                >
                  {currentScreen.content}
                </p>
              </>
            )}
          </div>

          {/* Progress indicator - clickable lines */}
          {displayScreens.length > 1 && (
            <div className="flex gap-2 mb-4">
              {displayScreens.map((screen: LocalScreen, index: number) => (
                <button
                  type="button"
                  key={screen.id}
                  className={`h-1 flex-1 rounded transition-colors duration-300 cursor-pointer hover:opacity-80 ${
                    index === currentInfoIndex
                      ? "bg-blue-500"
                      : "bg-slate-600 hover:bg-slate-500"
                  }`}
                  onClick={(e) => handleProgressClick(index, e)}
                  title={`Go to: ${displayScreens[index]?.title || `Screen ${index + 1}`}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
