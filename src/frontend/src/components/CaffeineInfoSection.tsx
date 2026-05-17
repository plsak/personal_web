import { stripInlineTextAlign } from "@/utils/htmlUtils";
import { uploadFile } from "@/utils/uploadFile";
import {
  ArrowUpDown,
  Edit2,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { CaffeineInfoScreenRecord } from "../backend";
import {
  useGetCaffeineInfo,
  useGetCaffeineInfoConfig,
  useGetSectionNames,
  useReorderCaffeineInfoScreens,
  useSetSectionName,
  useUpdateCaffeineInfo,
  useUpdateCaffeineInfoConfig,
} from "../hooks/useQueries";
import UnifiedTextEditor from "./UnifiedTextEditor";

interface LocalScreen {
  id: string;
  title: string;
  content: string;
  order: number;
  mediaUrl?: string;
}

interface CaffeineInfoSectionProps {
  isAdmin: boolean;
  cardBgStyle?: React.CSSProperties;
}

// RichTextEditor removed — now using UnifiedTextEditor

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}
function parseHeadingAlignment(title: string): {
  alignment: "left" | "center" | "right";
  cleanTitle: string;
} {
  if (title.startsWith("[L]"))
    return { alignment: "left", cleanTitle: title.slice(3) };
  if (title.startsWith("[C]"))
    return { alignment: "center", cleanTitle: title.slice(3) };
  if (title.startsWith("[R]"))
    return { alignment: "right", cleanTitle: title.slice(3) };
  return { alignment: "center", cleanTitle: title };
}

function encodeHeadingAlignment(
  alignment: "left" | "center" | "right",
  cleanTitle: string,
): string {
  if (alignment === "left") return `[L]${cleanTitle}`;
  if (alignment === "right") return `[R]${cleanTitle}`;
  return `[C]${cleanTitle}`;
}

const DEFAULT_SECTION_TITLE = "About";

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
      mediaUrl: r.mediaUrl,
    }));
}

function toBackendScreens(screens: LocalScreen[]): CaffeineInfoScreenRecord[] {
  return screens.map((s, idx) => ({
    id: s.id,
    title: s.title,
    content: s.content,
    order: BigInt(idx),
    mediaUrl: s.mediaUrl,
  }));
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|avi|ogv)$/i.test(url);
}

function MediaDisplay({ url }: { url: string }) {
  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        controls
        className="w-full rounded-lg mb-3 max-h-64 object-cover"
      >
        <track kind="captions" />
      </video>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="w-full rounded-lg mb-3 max-h-64 object-cover"
    />
  );
}

function ScreenMediaUpload({
  screenId,
  currentMediaUrl,
  onUpload,
  onRemove,
}: {
  screenId: string;
  currentMediaUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadFile(file);
      onUpload(result.url);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-2">
      {currentMediaUrl && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-slate-400 truncate max-w-[200px]">
            {currentMediaUrl.split("/").pop()}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 transition-colors p-1"
            title="Remove media"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFile}
        className="hidden"
        id={`media-upload-${screenId}`}
      />
      <label
        htmlFor={`media-upload-${screenId}`}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
          uploading
            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
            : "bg-slate-600 hover:bg-slate-500 text-slate-300"
        }`}
      >
        <Upload className="w-3 h-3" />
        {uploading
          ? "Uploading..."
          : currentMediaUrl
            ? "Replace media"
            : "Upload image/video"}
      </label>
      {uploadError && (
        <p className="text-red-400 text-xs mt-1">{uploadError}</p>
      )}
    </div>
  );
}

export default function CaffeineInfoSection({
  isAdmin,
  cardBgStyle,
}: CaffeineInfoSectionProps) {
  // Section name from backend
  const { data: sectionNames } = useGetSectionNames();
  const setSectionNameMutation = useSetSectionName();
  const [editingAboutName, setEditingAboutName] = useState(false);
  const [pendingAboutName, setPendingAboutName] = useState("");

  const displayAboutName = sectionNames?.about ?? DEFAULT_SECTION_TITLE;

  const handleAboutNameClick = () => {
    if (!isAdmin) return;
    setPendingAboutName(displayAboutName);
    setEditingAboutName(true);
  };

  const saveAboutName = async () => {
    const stripped = pendingAboutName.replace(/<[^>]*>/g, "").trim();
    if (stripped) {
      try {
        await setSectionNameMutation.mutateAsync({
          section: "about",
          name: pendingAboutName,
        });
      } catch (e) {
        console.error("Failed to save about name:", e);
      }
    }
    setEditingAboutName(false);
  };

  const cancelAboutName = () => {
    setEditingAboutName(false);
    setPendingAboutName("");
  };

  const { data: legacyCaffeineInfo, isLoading: legacyLoading } =
    useGetCaffeineInfo();
  const updateCaffeineInfo = useUpdateCaffeineInfo();

  const { data: configData, isLoading: configLoading } =
    useGetCaffeineInfoConfig();
  const updateConfig = useUpdateCaffeineInfoConfig();
  const reorderInfoScreens = useReorderCaffeineInfoScreens();

  const [isEditing, setIsEditing] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [currentInfoIndex, setCurrentInfoIndex] = useState(0);
  const [isRotationPaused, setIsRotationPaused] = useState(false);

  // Reordering mode state (mirrors LinksSection pattern)
  const [isReorderingMode, setIsReorderingMode] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<LocalScreen[]>([]);
  const [tempOrder, setTempOrder] = useState<LocalScreen[]>([]);
  const [isReorderSaving, setIsReorderSaving] = useState(false);
  const [reorderDraggedItem, setReorderDraggedItem] =
    useState<LocalScreen | null>(null);
  const [reorderDragOverIndex, setReorderDragOverIndex] = useState<
    number | null
  >(null);

  const [editSectionTitle, setEditSectionTitle] = useState(
    DEFAULT_SECTION_TITLE,
  );
  const [editScreens, setEditScreens] = useState<LocalScreen[]>(defaultScreens);
  const [_editingTitleMode, setEditingTitleMode] = useState(false);
  const [pendingTitle, setPendingTitle] = useState("");
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [editScreenData, setEditScreenData] = useState({
    title: "",
    content: "",
  });
  const [editScreenAlignment, setEditScreenAlignment] = useState<
    "left" | "center" | "right"
  >("center");
  const [newScreenAlignment, setNewScreenAlignment] = useState<
    "left" | "center" | "right"
  >("center");
  const [editScreenMediaMode, setEditScreenMediaMode] = useState<
    "text" | "media"
  >("text");
  const [editScreenMediaUrl, setEditScreenMediaUrl] = useState<
    string | undefined
  >(undefined);
  const [isAddingScreen, setIsAddingScreen] = useState(false);
  const [newScreen, setNewScreen] = useState({ title: "", content: "" });
  const [newScreenMediaMode, setNewScreenMediaMode] = useState<
    "text" | "media"
  >("text");
  const [newScreenMediaUrl, setNewScreenMediaUrl] = useState<
    string | undefined
  >(undefined);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [editContent, setEditContent] = useState("");

  const displaySectionTitle = configData?.sectionTitle ?? DEFAULT_SECTION_TITLE;
  const displayScreens =
    configData && configData.screens.length > 0
      ? toLocalScreens(configData.screens)
      : defaultScreens;

  const useLegacyMode =
    legacyCaffeineInfo !== null && legacyCaffeineInfo !== undefined;

  const isLoading = legacyLoading || configLoading;

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

  const startManaging = () => {
    if (!isAdmin) return;
    setEditSectionTitle(displaySectionTitle);
    setEditScreens(displayScreens);
    setSaveError(null);
    setEditingTitleMode(false);
    setEditingScreenId(null);
    setIsAddingScreen(false);
    setNewScreen({ title: "", content: "" });
    setNewScreenMediaMode("text");
    setNewScreenMediaUrl(undefined);
    setEditScreenData({ title: "", content: "" });
    setIsReorderingMode(false);
    setOriginalOrder([]);
    setTempOrder([]);
    setIsManaging(true);
  };

  const cancelManaging = () => {
    setIsManaging(false);
    setEditingTitleMode(false);
    setEditingScreenId(null);
    setIsAddingScreen(false);
    setPendingTitle("");
    setNewScreen({ title: "", content: "" });
    setNewScreenMediaMode("text");
    setNewScreenMediaUrl(undefined);
    setEditScreenData({ title: "", content: "" });
    setSaveError(null);
    setIsReorderingMode(false);
    setOriginalOrder([]);
    setTempOrder([]);
  };

  // Reordering mode functions
  const enterReorderingMode = () => {
    const currentOrder = [...editScreens];
    setOriginalOrder(currentOrder);
    setTempOrder(currentOrder);
    setIsReorderingMode(true);
  };

  const exitReorderingMode = () => {
    setIsReorderingMode(false);
    setOriginalOrder([]);
    setTempOrder([]);
    setReorderDraggedItem(null);
    setReorderDragOverIndex(null);
    setIsReorderSaving(false);
  };

  const cancelReordering = () => {
    setTempOrder([...originalOrder]);
    setEditScreens([...originalOrder]);
    exitReorderingMode();
  };

  const saveNewScreenOrder = async () => {
    try {
      setIsReorderSaving(true);
      const newOrderIds = tempOrder.map((s) => s.id);
      await reorderInfoScreens.mutateAsync(newOrderIds);
      setEditScreens([...tempOrder]);
      exitReorderingMode();
    } catch (error) {
      console.error("Reorder failed:", error);
      setIsReorderSaving(false);
    }
  };

  // Reorder drag handlers
  const handleReorderDragStart = (e: React.DragEvent, screen: LocalScreen) => {
    if (!isReorderingMode || isReorderSaving) return;
    setReorderDraggedItem(screen);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", screen.id);
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handleReorderDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    setReorderDraggedItem(null);
    setReorderDragOverIndex(null);
  };

  const handleReorderDragOver = (e: React.DragEvent, index: number) => {
    if (!isReorderingMode || !reorderDraggedItem || isReorderSaving) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (reorderDragOverIndex !== index) {
      setReorderDragOverIndex(index);
      const currentOrder = [...tempOrder];
      const dragIndex = currentOrder.findIndex(
        (s) => s.id === reorderDraggedItem.id,
      );
      if (dragIndex !== -1 && dragIndex !== index) {
        const [draggedScreen] = currentOrder.splice(dragIndex, 1);
        currentOrder.splice(index, 0, draggedScreen);
        setTempOrder(currentOrder);
      }
    }
  };

  const handleReorderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setReorderDragOverIndex(null);
    setReorderDraggedItem(null);
  };

  const _handleUpdateSectionTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingTitle.trim()) {
      setEditSectionTitle(pendingTitle.trim());
      setEditingTitleMode(false);
    }
  };

  const handleAddScreen = (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = newScreen.title.trim() || newScreen.content.trim();
    const hasMedia = newScreenMediaMode === "media" && newScreenMediaUrl;
    if (!hasText && !hasMedia) return;
    const screen: LocalScreen = {
      id: `new-${Date.now()}`,
      title: encodeHeadingAlignment(newScreenAlignment, newScreen.title.trim()),
      content:
        newScreenMediaMode === "media"
          ? newScreen.content
          : newScreen.content.trim(),
      order: editScreens.length,
      mediaUrl: newScreenMediaMode === "media" ? newScreenMediaUrl : undefined,
    };
    setEditScreens([...editScreens, screen]);
    setNewScreen({ title: "", content: "" });
    setNewScreenMediaMode("text");
    setNewScreenMediaUrl(undefined);
    setNewScreenAlignment("center");
    setIsAddingScreen(false);
  };

  const startEditScreen = (screen: LocalScreen) => {
    setEditingScreenId(screen.id);
    const { alignment, cleanTitle } = parseHeadingAlignment(screen.title);
    setEditScreenAlignment(alignment);
    setEditScreenData({ title: cleanTitle, content: screen.content });
    setEditScreenMediaMode(screen.mediaUrl ? "media" : "text");
    setEditScreenMediaUrl(screen.mediaUrl);
  };

  const handleEditScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      editingScreenId !== null &&
      editScreenData.title.trim() &&
      (editScreenMediaMode === "media" || editScreenData.content.trim())
    ) {
      setEditScreens(
        editScreens.map((s) =>
          s.id === editingScreenId
            ? {
                ...s,
                title: encodeHeadingAlignment(
                  editScreenAlignment,
                  editScreenData.title.trim(),
                ),
                content:
                  editScreenMediaMode === "media"
                    ? editScreenData.content
                    : editScreenData.content.trim(),
                mediaUrl:
                  editScreenMediaMode === "media"
                    ? editScreenMediaUrl
                    : undefined,
              }
            : s,
        ),
      );
      setEditingScreenId(null);
      setEditScreenData({ title: "", content: "" });
      setEditScreenMediaMode("text");
      setEditScreenMediaUrl(undefined);
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

  const handleScreenMediaUpload = (screenId: string, url: string) => {
    setEditScreens((prev) =>
      prev.map((s) => (s.id === screenId ? { ...s, mediaUrl: url } : s)),
    );
  };

  const handleScreenMediaRemove = (screenId: string) => {
    setEditScreens((prev) =>
      prev.map((s) => (s.id === screenId ? { ...s, mediaUrl: undefined } : s)),
    );
  };

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
    <div
      className="bg-slate-800 rounded-lg p-6 border border-slate-700 transition-colors"
      style={cardBgStyle}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-3">
            {editingAboutName ? (
              <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                <UnifiedTextEditor
                  value={pendingAboutName}
                  onChange={setPendingAboutName}
                  placeholder="Section name"
                  showFontPicker
                  showColorPicker
                  minRows={1}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveAboutName}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                  >
                    <Save className="w-3 h-3" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelAboutName}
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
                  onClick={handleAboutNameClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleAboutNameClick();
                  }}
                  role={isAdmin ? "button" : undefined}
                  tabIndex={isAdmin ? 0 : undefined}
                  title={isAdmin ? "Click to rename" : undefined}
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-controlled section name
                  dangerouslySetInnerHTML={{ __html: displayAboutName }}
                />
                {isAdmin && !isManaging && (
                  <Pencil
                    className="w-3 h-3 text-slate-500 hover:text-blue-400 cursor-pointer transition-colors"
                    onClick={handleAboutNameClick}
                  />
                )}
              </div>
            )}
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
          {/* Screens Management */}
          <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-100">
                Information Screens
              </h3>
              {!isReorderingMode ? (
                <div className="flex gap-2">
                  {editScreens.length > 1 && (
                    <button
                      type="button"
                      onClick={enterReorderingMode}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded transition-colors"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      Change Order
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAddingScreen(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Screen
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveNewScreenOrder}
                    disabled={isReorderSaving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-2 rounded transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {isReorderSaving ? "Saving..." : "Save Order"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelReordering}
                    disabled={isReorderSaving}
                    className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-white px-3 py-2 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Reordering mode banner */}
            {isReorderingMode && (
              <div className="mb-4 p-3 bg-purple-900/30 border border-purple-600/50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-300">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isReorderSaving
                      ? "Saving Order..."
                      : "Reordering Mode Active"}
                  </span>
                </div>
                <p className="text-xs text-purple-400 mt-1">
                  {isReorderSaving
                    ? "Please wait while the new order is being saved..."
                    : 'Drag and drop screens to rearrange them. Position numbers show the final order. Click "Save Order" to keep changes or "Cancel" to discard.'}
                </p>
              </div>
            )}

            {/* Add New Screen Form */}
            {isAddingScreen && (
              <form
                onSubmit={handleAddScreen}
                className="mb-4 p-4 bg-slate-600 rounded border border-slate-500"
              >
                {/* Screen title (optional) */}
                <div className="mb-3">
                  <UnifiedTextEditor
                    value={newScreen.title}
                    onChange={(html) =>
                      setNewScreen({ ...newScreen, title: html })
                    }
                    placeholder="Screen title (optional)"
                    showFontPicker
                    showColorPicker
                    minRows={1}
                  />
                  {/* Heading alignment */}
                  <div className="flex gap-1 mt-2">
                    <span className="text-xs text-slate-400 self-center mr-1">
                      Align:
                    </span>
                    {(["left", "center", "right"] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setNewScreenAlignment(a)}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                          newScreenAlignment === a
                            ? "bg-blue-600 text-white"
                            : "bg-slate-500 text-slate-300 hover:bg-slate-400"
                        }`}
                      >
                        {a.charAt(0).toUpperCase() + a.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Content mode toggle */}
                <div className="flex gap-1 mb-3">
                  <button
                    type="button"
                    onClick={() => setNewScreenMediaMode("text")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      newScreenMediaMode === "text"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-500 text-slate-300 hover:bg-slate-400"
                    }`}
                  >
                    📝 Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScreenMediaMode("media")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      newScreenMediaMode === "media"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-500 text-slate-300 hover:bg-slate-400"
                    }`}
                  >
                    🖼️ Image / Video
                  </button>
                </div>
                {/* Text content area (only in text mode) */}
                {newScreenMediaMode === "text" && (
                  <div className="mb-3">
                    <UnifiedTextEditor
                      value={newScreen.content}
                      onChange={(html) =>
                        setNewScreen({ ...newScreen, content: html })
                      }
                      placeholder="Screen content (optional)"
                      alignmentControl={false}
                      showFontPicker
                      showColorPicker
                      minRows={4}
                    />
                  </div>
                )}
                {/* Media upload (only in media mode) */}
                {newScreenMediaMode === "media" && (
                  <div className="mb-3">
                    {newScreenMediaUrl && (
                      <div className="mb-2">
                        {isVideoUrl(newScreenMediaUrl) ? (
                          <video
                            src={newScreenMediaUrl}
                            controls
                            className="w-full rounded max-h-40 object-cover mb-1"
                          >
                            <track kind="captions" />
                          </video>
                        ) : (
                          <img
                            src={newScreenMediaUrl}
                            alt="preview"
                            className="w-full rounded max-h-40 object-cover mb-1"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setNewScreenMediaUrl(undefined)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-3 h-3" /> Remove media
                        </button>
                      </div>
                    )}
                    <ScreenMediaUpload
                      screenId="new-screen"
                      currentMediaUrl={newScreenMediaUrl}
                      onUpload={(url) => setNewScreenMediaUrl(url)}
                      onRemove={() => setNewScreenMediaUrl(undefined)}
                    />
                    {!newScreenMediaUrl && (
                      <p className="text-xs text-slate-400 mt-1">
                        Upload an image or video to display on this screen
                      </p>
                    )}
                    {/* Optional caption for media screens */}
                    <div className="mt-3">
                      <input
                        type="text"
                        value={newScreen.content}
                        onChange={(e) =>
                          setNewScreen({
                            ...newScreen,
                            content: e.target.value,
                          })
                        }
                        placeholder="Optional caption text (shown below media)"
                        className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                )}
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
                      setNewScreenMediaMode("text");
                      setNewScreenMediaUrl(undefined);
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
              {(isReorderingMode ? tempOrder : editScreens).map(
                (screen: LocalScreen, index: number) => {
                  const isDraggedScreen = reorderDraggedItem?.id === screen.id;
                  const isDropTarget =
                    reorderDragOverIndex === index && !isDraggedScreen;

                  return (
                    <div
                      key={screen.id}
                      className={`p-3 bg-slate-600 rounded border transition-all duration-200 ${
                        isReorderingMode && !isReorderSaving
                          ? "cursor-move"
                          : ""
                      } ${
                        isDropTarget
                          ? "border-blue-500 bg-slate-550 transform scale-105"
                          : "border-slate-500"
                      } ${isDraggedScreen ? "opacity-50" : ""}`}
                      draggable={isReorderingMode && !isReorderSaving}
                      onDragStart={(e) => handleReorderDragStart(e, screen)}
                      onDragEnd={handleReorderDragEnd}
                      onDragOver={(e) => handleReorderDragOver(e, index)}
                      onDrop={handleReorderDrop}
                    >
                      {editingScreenId === screen.id ? (
                        <form onSubmit={handleEditScreen}>
                          {/* Screen title */}
                          <div className="mb-3">
                            <UnifiedTextEditor
                              value={editScreenData.title}
                              onChange={(html) =>
                                setEditScreenData({
                                  ...editScreenData,
                                  title: html,
                                })
                              }
                              placeholder="Screen title"
                              showFontPicker
                              showColorPicker
                              minRows={1}
                            />
                            {/* Heading alignment */}
                            <div className="flex gap-1 mt-2">
                              <span className="text-xs text-slate-400 self-center mr-1">
                                Align:
                              </span>
                              {(["left", "center", "right"] as const).map(
                                (a) => (
                                  <button
                                    key={a}
                                    type="button"
                                    onClick={() => setEditScreenAlignment(a)}
                                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                      editScreenAlignment === a
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-500 text-slate-300 hover:bg-slate-400"
                                    }`}
                                  >
                                    {a.charAt(0).toUpperCase() + a.slice(1)}
                                  </button>
                                ),
                              )}
                            </div>
                          </div>
                          {/* Content mode toggle */}
                          <div className="flex gap-1 mb-3">
                            <button
                              type="button"
                              onClick={() => setEditScreenMediaMode("text")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                editScreenMediaMode === "text"
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-500 text-slate-300 hover:bg-slate-400"
                              }`}
                            >
                              📝 Text
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditScreenMediaMode("media")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                editScreenMediaMode === "media"
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-500 text-slate-300 hover:bg-slate-400"
                              }`}
                            >
                              🖼️ Image / Video
                            </button>
                          </div>
                          {/* Text content area (only in text mode) */}
                          {editScreenMediaMode === "text" && (
                            <div className="mb-3">
                              <UnifiedTextEditor
                                value={editScreenData.content}
                                onChange={(html) =>
                                  setEditScreenData({
                                    ...editScreenData,
                                    content: html,
                                  })
                                }
                                placeholder="Screen content"
                                alignmentControl={false}
                                showFontPicker
                                showColorPicker
                                minRows={4}
                              />
                            </div>
                          )}
                          {/* Media upload (only in media mode) */}
                          {editScreenMediaMode === "media" && (
                            <div className="mb-3">
                              {editScreenMediaUrl && (
                                <div className="mb-2">
                                  {isVideoUrl(editScreenMediaUrl) ? (
                                    <video
                                      src={editScreenMediaUrl}
                                      controls
                                      className="w-full rounded max-h-40 object-cover mb-1"
                                    >
                                      <track kind="captions" />
                                    </video>
                                  ) : (
                                    <img
                                      src={editScreenMediaUrl}
                                      alt="preview"
                                      className="w-full rounded max-h-40 object-cover mb-1"
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditScreenMediaUrl(undefined)
                                    }
                                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <X className="w-3 h-3" /> Remove media
                                  </button>
                                </div>
                              )}
                              <ScreenMediaUpload
                                screenId={`edit-${screen.id}`}
                                currentMediaUrl={editScreenMediaUrl}
                                onUpload={(url) => setEditScreenMediaUrl(url)}
                                onRemove={() =>
                                  setEditScreenMediaUrl(undefined)
                                }
                              />
                              {!editScreenMediaUrl && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Upload an image or video to display on this
                                  screen
                                </p>
                              )}
                              {/* Optional caption for media screens */}
                              <div className="mt-3">
                                <input
                                  type="text"
                                  value={editScreenData.content}
                                  onChange={(e) =>
                                    setEditScreenData({
                                      ...editScreenData,
                                      content: e.target.value,
                                    })
                                  }
                                  placeholder="Optional caption text (shown below media)"
                                  className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              </div>
                            </div>
                          )}
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
                                setEditScreenMediaMode("text");
                                setEditScreenMediaUrl(undefined);
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
                            <div className="flex items-start gap-2 flex-1">
                              {isReorderingMode && !isReorderSaving && (
                                <div className="flex-shrink-0 mt-1 drag-handle">
                                  <GripVertical className="w-4 h-4 text-slate-400 hover:text-slate-200 transition-colors" />
                                </div>
                              )}
                              {isReorderingMode && (
                                <div className="flex-shrink-0 mt-1">
                                  <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {index + 1}
                                  </div>
                                </div>
                              )}
                              <div className="flex-1">
                                <h4
                                  className="font-medium text-slate-100 mb-1 rich-text-content"
                                  // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-controlled rich text
                                  dangerouslySetInnerHTML={{
                                    __html: stripInlineTextAlign(
                                      sanitizeHtml(
                                        parseHeadingAlignment(screen.title)
                                          .cleanTitle,
                                      ),
                                    ),
                                  }}
                                />
                                <p className="text-slate-300 text-sm line-clamp-2">
                                  {screen.content
                                    .replace(/<[^>]*>/g, "")
                                    .slice(0, 150)}
                                </p>
                                {/* Media preview in edit list */}
                                {screen.mediaUrl && (
                                  <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                                    {isVideoUrl(screen.mediaUrl) ? "🎬" : "🖼️"}
                                    <span className="truncate max-w-[180px]">
                                      {screen.mediaUrl.split("/").pop()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {!isReorderingMode && (
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
                                    onClick={() =>
                                      handleDeleteScreen(screen.id)
                                    }
                                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Media upload per screen — hidden in reorder mode */}
                          {!isReorderingMode && (
                            <ScreenMediaUpload
                              screenId={screen.id}
                              currentMediaUrl={screen.mediaUrl}
                              onUpload={(url) =>
                                handleScreenMediaUpload(screen.id, url)
                              }
                              onRemove={() =>
                                handleScreenMediaRemove(screen.id)
                              }
                            />
                          )}
                          <div className="text-xs text-slate-400 mt-2">
                            Screen {index + 1} of{" "}
                            {
                              (isReorderingMode ? tempOrder : editScreens)
                                .length
                            }
                          </div>
                        </>
                      )}
                    </div>
                  );
                },
              )}
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
                <h3
                  className={`text-lg font-semibold text-blue-400 mb-2 select-none rich-text-content ${{ left: "text-left", center: "text-center", right: "text-right" }[parseHeadingAlignment(currentScreen.title).alignment]}`}
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-controlled rich text heading
                  dangerouslySetInnerHTML={{
                    __html: stripInlineTextAlign(
                      sanitizeHtml(
                        parseHeadingAlignment(currentScreen.title).cleanTitle,
                      ),
                    ),
                  }}
                />
                {/* Image between heading and text */}
                {currentScreen.mediaUrl && (
                  <MediaDisplay url={currentScreen.mediaUrl} />
                )}
                <div
                  className={`text-slate-300 leading-relaxed select-none rich-text-content ${
                    isRotationPaused
                      ? "cursor-pointer hover:bg-slate-700 p-2 rounded transition-colors"
                      : ""
                  }`}
                  onClick={handleTextClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleTextClick(e as unknown as React.MouseEvent);
                  }}
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized rich text content from backend
                  dangerouslySetInnerHTML={{
                    __html: stripInlineTextAlign(
                      sanitizeHtml(currentScreen.content),
                    ),
                  }}
                />
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
