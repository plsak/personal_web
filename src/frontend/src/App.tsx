import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Heart,
  Save,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { createActor } from "./backend";
import AdminManagement from "./components/AdminManagement";
import BlogSection from "./components/BlogSection";
import CaffeineInfoSection from "./components/CaffeineInfoSection";
import HeadingEditor from "./components/HeadingEditor";
import LinksSection from "./components/LinksSection";
import LoginButton from "./components/LoginButton";
import {
  useGetBackgroundConfig,
  useGetHeadingConfig,
  useGetSectionNames,
  useGetSectionOrder,
  useGetSectionVisibility,
  useIncrementVisitCount,
  useIsCallerAdmin,
  useSetSectionOrder,
  useSetSectionVisibility,
} from "./hooks/useQueries";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor(createActor);
  const { data: isAdmin = false, refetch: refetchAdmin } = useIsCallerAdmin();
  const { data: headingConfig } = useGetHeadingConfig();
  const { data: backgroundConfig } = useGetBackgroundConfig();
  const { data: sectionOrder = ["about", "links", "blog"] } =
    useGetSectionOrder();
  const { data: sectionVisibility = { about: true, links: true, blog: true } } =
    useGetSectionVisibility();
  const {
    data: sectionNames = { about: "About", links: "Links", blog: "Blog" },
  } = useGetSectionNames();
  const setSectionOrder = useSetSectionOrder();
  const setSectionVisibility = useSetSectionVisibility();
  const incrementVisitCount = useIncrementVisitCount();
  const hasIncrementedRef = useRef(false);
  const hasBootstrappedRef = useRef(false);

  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  const [sectionReorderMode, setSectionReorderMode] = useState(false);
  const [tempOrder, setTempOrder] = useState<string[]>([]);
  const [tempVisibility, setTempVisibility] = useState<{
    about: boolean;
    links: boolean;
    blog: boolean;
  }>({ about: true, links: true, blog: true });
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  const isAuthenticated = !!identity;

  // Bootstrap admin: call initializeAccessControl whenever identity + actor are
  // available, using a ref to ensure we only call it once per session.
  // We also call it on page-load if the user was already authenticated.
  useEffect(() => {
    if (identity && actor && !hasBootstrappedRef.current) {
      hasBootstrappedRef.current = true;
      actor
        .initializeAccessControl()
        .then(() => refetchAdmin())
        .catch((err: unknown) => {
          console.warn("initializeAccessControl (non-fatal):", err);
          refetchAdmin();
        });
    }
    if (!identity) {
      hasBootstrappedRef.current = false;
    }
  }, [identity, actor, refetchAdmin]);

  // Increment visit count on app load - ensure it happens only once per session
  useEffect(() => {
    // Use a more reliable method to track visits
    const sessionKey = `visit_tracked_${Date.now()}`;
    const hasVisitedThisSession = sessionStorage.getItem("visit_tracked");

    if (!hasVisitedThisSession && !hasIncrementedRef.current) {
      hasIncrementedRef.current = true;
      sessionStorage.setItem("visit_tracked", sessionKey);

      // Add a small delay to ensure the actor is ready
      const timer = setTimeout(() => {
        incrementVisitCount.mutate();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [incrementVisitCount]);

  // Helper function to format principal
  const formatPrincipal = (principal: string) => {
    if (principal.length <= 8) return principal;
    return `${principal.slice(0, 4)}...${principal.slice(-4)}`;
  };

  // Helper function to copy principal to clipboard with feedback
  const copyPrincipal = async () => {
    if (identity) {
      try {
        await navigator.clipboard.writeText(identity.getPrincipal().toString());
        setShowCopiedFeedback(true);
        setTimeout(() => setShowCopiedFeedback(false), 2000);
      } catch (err) {
        console.error("Failed to copy principal:", err);
      }
    }
  };

  // Get heading configuration with defaults
  const getHeadingText = () => {
    return headingConfig?.text || "";
  };

  const getHeadingFont = () => {
    return headingConfig?.font || "cursive";
  };

  const getHeadingColor = () => {
    return headingConfig?.color || "#f1f5f9"; // slate-100
  };

  const getHeaderBgStyle = (): React.CSSProperties => {
    const imgUrl = headingConfig?.backgroundImageUrl;
    const bgCol = headingConfig?.backgroundColor;
    if (imgUrl) {
      return {
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    if (bgCol) return { backgroundColor: bgCol };
    return {};
  };

  const getPageBgStyle = (): React.CSSProperties => {
    const imgUrl = backgroundConfig?.pageBackgroundImageUrl;
    const bgCol = backgroundConfig?.pageBackgroundColor;
    if (imgUrl) {
      return {
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      };
    }
    if (bgCol) return { backgroundColor: bgCol };
    return {};
  };

  const getCardBgStyle = (
    imageUrl?: string,
    color?: string,
  ): React.CSSProperties => {
    if (imageUrl) {
      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    if (color) return { backgroundColor: color };
    return {};
  };

  const getHeadingFontClass = () => {
    const font = getHeadingFont();
    switch (font) {
      case "cursive":
        return "cursive-font";
      case "serif":
        return "serif-font";
      case "sans-serif":
        return "sans-serif-font";
      case "monospace":
        return "monospace-font";
      case "fantasy":
        return "fantasy-font";
      default:
        return "cursive-font";
    }
  };

  // Section reorder helpers
  const enterReorderMode = () => {
    setTempOrder([...sectionOrder]);
    setTempVisibility({ ...sectionVisibility });
    setSectionReorderMode(true);
  };

  const cancelReorderMode = () => {
    setSectionReorderMode(false);
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const saveReorderMode = async () => {
    await setSectionOrder.mutateAsync(tempOrder);
    await setSectionVisibility.mutateAsync(tempVisibility);
    setSectionReorderMode(false);
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleDragStart = (section: string) => {
    setDraggedSection(section);
  };

  const handleDragOver = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    if (draggedSection && draggedSection !== section) {
      setDragOverSection(section);
    }
  };

  const handleDrop = (e: React.DragEvent, targetSection: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSection) return;
    const newOrder = [...tempOrder];
    const fromIdx = newOrder.indexOf(draggedSection);
    const toIdx = newOrder.indexOf(targetSection);
    if (fromIdx === -1 || toIdx === -1) return;
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedSection);
    setTempOrder(newOrder);
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const toggleSectionVisibility = (section: string) => {
    setTempVisibility((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  const getSectionDisplayName = (key: string) => {
    if (key === "about") return sectionNames.about || "About";
    if (key === "links") return sectionNames.links || "Links";
    if (key === "blog") return sectionNames.blog || "Blog";
    return key;
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-300">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-900 text-slate-100"
      style={getPageBgStyle()}
    >
      {/* Header */}
      <header
        className="bg-slate-800 border-b border-slate-700"
        style={getHeaderBgStyle()}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                <div className="relative">
                  <h1
                    className={`text-4xl font-bold ${getHeadingFontClass()}`}
                    style={{ color: getHeadingColor() }}
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: heading is admin-controlled rich text
                    dangerouslySetInnerHTML={{ __html: getHeadingText() }}
                  />
                  {isAdmin && (
                    <div className="absolute -top-10 right-0">
                      <HeadingEditor />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3">
                {isAdmin && <AdminManagement />}
                <LoginButton />
              </div>
              {isAuthenticated && (
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-400">
                    {formatPrincipal(identity.getPrincipal().toString())}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={copyPrincipal}
                      className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                      title="Copy full principal ID"
                    >
                      {showCopiedFeedback ? (
                        <Check className="w-3 h-3 text-slate-300" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    {showCopiedFeedback && (
                      <div className="absolute -top-8 right-0 bg-slate-600 text-slate-200 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        Copied!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Access Denied Banner for authenticated non-admin users */}
      {isAuthenticated && !isAdmin && (
        <div className="bg-red-900 border-b border-red-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-200 text-sm">
                <strong>Access Denied:</strong> You are viewing in read-only
                mode. Admin privileges required for content management.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Reorder Mode */}
        {isAdmin && sectionReorderMode && (
          <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-200">
                Drag to reorder sections. Toggle eye to show/hide.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveReorderMode}
                  disabled={
                    setSectionOrder.isPending || setSectionVisibility.isPending
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-green-700 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {setSectionOrder.isPending || setSectionVisibility.isPending
                    ? "Saving..."
                    : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelReorderMode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {tempOrder.map((sectionKey) => {
                const isVisible =
                  tempVisibility[sectionKey as keyof typeof tempVisibility];
                const isDragging = draggedSection === sectionKey;
                const isDragOver = dragOverSection === sectionKey;
                return (
                  <div
                    key={sectionKey}
                    draggable
                    onDragStart={() => handleDragStart(sectionKey)}
                    onDragOver={(e) => handleDragOver(e, sectionKey)}
                    onDrop={(e) => handleDrop(e, sectionKey)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded border cursor-grab active:cursor-grabbing transition-all ${
                      isDragging
                        ? "opacity-40 border-slate-500 bg-slate-700"
                        : isDragOver
                          ? "border-blue-500 bg-slate-700 scale-[1.01]"
                          : "border-slate-600 bg-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span
                      className={`flex-1 text-sm font-medium ${isVisible ? "text-slate-100" : "text-slate-500 line-through"}`}
                    >
                      {getSectionDisplayName(sectionKey)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(sectionKey)}
                      className={`p-1 rounded transition-colors ${isVisible ? "text-green-400 hover:text-green-300" : "text-slate-500 hover:text-slate-400"}`}
                      title={isVisible ? "Hide section" : "Show section"}
                    >
                      {isVisible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reorder Sections button (admin only, outside reorder mode) */}
        {isAdmin && !sectionReorderMode && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={enterReorderMode}
              data-ocid="sections.reorder_button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors"
            >
              <GripVertical className="w-3.5 h-3.5" />
              Reorder &amp; Show/Hide Sections
            </button>
          </div>
        )}

        {/* Sections - single column in reorder mode, grid otherwise */}
        {sectionReorderMode ? (
          <div className="space-y-8">
            {tempOrder.map((key) => {
              if (!tempVisibility[key as keyof typeof tempVisibility])
                return null;
              if (key === "about")
                return (
                  <CaffeineInfoSection
                    key="about"
                    isAdmin={isAdmin}
                    cardBgStyle={getCardBgStyle(
                      backgroundConfig?.aboutCardImageUrl,
                      backgroundConfig?.aboutCardColor,
                    )}
                  />
                );
              if (key === "links")
                return (
                  <LinksSection
                    key="links"
                    isAdmin={isAdmin}
                    cardBgStyle={getCardBgStyle(
                      backgroundConfig?.linksCardImageUrl,
                      backgroundConfig?.linksCardColor,
                    )}
                  />
                );
              if (key === "blog")
                return (
                  <BlogSection
                    key="blog"
                    isAdmin={isAdmin}
                    cardBgStyle={getCardBgStyle(
                      backgroundConfig?.blogCardImageUrl,
                      backgroundConfig?.blogCardColor,
                    )}
                  />
                );
              return null;
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column: first two sections in order */}
            <div className="lg:col-span-2 space-y-8">
              {sectionOrder
                .filter(
                  (k) =>
                    k !==
                    (sectionOrder.find(
                      (s) =>
                        !sectionOrder
                          .slice(0, sectionOrder.indexOf(s))
                          .some(() => false),
                    ) === sectionOrder[sectionOrder.length - 1]
                      ? sectionOrder[sectionOrder.length - 1]
                      : sectionOrder[sectionOrder.length - 1]),
                )
                .slice(0, 2)
                .map((key) => {
                  if (!sectionVisibility[key as keyof typeof sectionVisibility])
                    return null;
                  if (key === "about")
                    return (
                      <CaffeineInfoSection
                        key="about"
                        isAdmin={isAdmin}
                        cardBgStyle={getCardBgStyle(
                          backgroundConfig?.aboutCardImageUrl,
                          backgroundConfig?.aboutCardColor,
                        )}
                      />
                    );
                  if (key === "links")
                    return (
                      <LinksSection
                        key="links"
                        isAdmin={isAdmin}
                        cardBgStyle={getCardBgStyle(
                          backgroundConfig?.linksCardImageUrl,
                          backgroundConfig?.linksCardColor,
                        )}
                      />
                    );
                  if (key === "blog")
                    return (
                      <BlogSection
                        key="blog"
                        isAdmin={isAdmin}
                        cardBgStyle={getCardBgStyle(
                          backgroundConfig?.blogCardImageUrl,
                          backgroundConfig?.blogCardColor,
                        )}
                      />
                    );
                  return null;
                })}
            </div>
            {/* Right column: last section in order */}
            <div className="lg:col-span-1">
              {(() => {
                const lastKey = sectionOrder[sectionOrder.length - 1];
                if (
                  !lastKey ||
                  !sectionVisibility[lastKey as keyof typeof sectionVisibility]
                )
                  return null;
                if (lastKey === "about")
                  return (
                    <CaffeineInfoSection
                      isAdmin={isAdmin}
                      cardBgStyle={getCardBgStyle(
                        backgroundConfig?.aboutCardImageUrl,
                        backgroundConfig?.aboutCardColor,
                      )}
                    />
                  );
                if (lastKey === "links")
                  return (
                    <LinksSection
                      isAdmin={isAdmin}
                      cardBgStyle={getCardBgStyle(
                        backgroundConfig?.linksCardImageUrl,
                        backgroundConfig?.linksCardColor,
                      )}
                    />
                  );
                if (lastKey === "blog")
                  return (
                    <BlogSection
                      isAdmin={isAdmin}
                      cardBgStyle={getCardBgStyle(
                        backgroundConfig?.blogCardImageUrl,
                        backgroundConfig?.blogCardColor,
                      )}
                    />
                  );
                return null;
              })()}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-slate-400 text-xs">
            © 2025. Built with <Heart className="inline w-3 h-3 text-red-500" />{" "}
            using{" "}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
