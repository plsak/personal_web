import React, { useState, useEffect } from 'react';
import { useGetCaffeineInfo, useUpdateCaffeineInfo } from '../hooks/useQueries';
import { Edit2, Save, X, Coffee, Sparkles, Plus, Trash2 } from 'lucide-react';

interface CaffeineInfoScreen {
  id: number;
  title: string;
  content: string;
}

interface CaffeineInfoSectionProps {
  isAdmin: boolean;
}

// Default screens that will be used if no backend content exists
const defaultCaffeineScreens: CaffeineInfoScreen[] = [
  {
    id: 0,
    title: "AI-Powered Development",
    content: "Caffeine is an advanced AI system designed to accelerate software development. It understands code patterns, generates intelligent solutions, and helps developers build applications faster than ever before."
  },
  {
    id: 1,
    title: "Smart Code Generation",
    content: "With deep understanding of programming languages and frameworks, Caffeine can generate complete applications, components, and functions based on natural language descriptions and requirements."
  },
  {
    id: 2,
    title: "Intelligent Problem Solving",
    content: "Caffeine analyzes complex technical challenges and provides optimized solutions. It can debug code, suggest improvements, and implement best practices automatically."
  },
  {
    id: 3,
    title: "Multi-Language Support",
    content: "Supporting dozens of programming languages and frameworks, Caffeine adapts to your tech stack. From React and TypeScript to Python and Rust, it speaks your language."
  },
  {
    id: 4,
    title: "Real-Time Collaboration",
    content: "Work alongside Caffeine as your AI pair programmer. It understands context, maintains code consistency, and helps you iterate quickly on ideas and implementations."
  }
];

export default function CaffeineInfoSection({ isAdmin }: CaffeineInfoSectionProps) {
  const { data: legacyCaffeineInfo, isLoading } = useGetCaffeineInfo();
  const updateCaffeineInfo = useUpdateCaffeineInfo();

  const [isEditing, setIsEditing] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [currentInfoIndex, setCurrentInfoIndex] = useState(0);
  const [isRotationPaused, setIsRotationPaused] = useState(false);
  
  // Local state for managing screens and title
  const [sectionTitle, setSectionTitle] = useState("About Caffeine AI");
  const [screens, setScreens] = useState<CaffeineInfoScreen[]>(defaultCaffeineScreens);
  const [nextScreenId, setNextScreenId] = useState(5);
  
  // Management state
  const [editingScreenId, setEditingScreenId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newScreen, setNewScreen] = useState({ title: '', content: '' });
  const [editScreenData, setEditScreenData] = useState({ title: '', content: '' });
  const [isAddingScreen, setIsAddingScreen] = useState(false);

  // Legacy editing state
  const [editContent, setEditContent] = useState('');

  // Determine if we should use legacy mode (single content) or enhanced mode (multiple screens)
  const useLegacyMode = legacyCaffeineInfo !== null && legacyCaffeineInfo !== undefined;

  // Rotate through screens every 5 seconds, but only if not paused and not in legacy mode
  useEffect(() => {
    if (!useLegacyMode && !isRotationPaused && screens.length > 0 && !isEditing && !isManaging) {
      const interval = setInterval(() => {
        setCurrentInfoIndex((prev) => (prev + 1) % screens.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [useLegacyMode, isRotationPaused, screens.length, isEditing, isManaging]);

  const handlePaneClick = () => {
    if (!useLegacyMode && !isEditing && !isManaging) {
      setIsRotationPaused(true);
    }
  };

  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRotationPaused && !useLegacyMode && !isEditing && !isManaging && screens.length > 0) {
      setCurrentInfoIndex((prev) => (prev + 1) % screens.length);
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
    setEditContent(legacyCaffeineInfo?.content || '');
    setIsEditing(true);
  };

  const cancelLegacyEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleLegacySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editContent.trim()) {
      try {
        await updateCaffeineInfo.mutateAsync(editContent.trim());
        setIsEditing(false);
        setEditContent('');
      } catch (error) {
        console.error('Failed to update caffeine info:', error);
      }
    }
  };

  // Enhanced management functions
  const startManaging = () => {
    if (!isAdmin) return;
    setNewSectionTitle(sectionTitle);
    setIsManaging(true);
  };

  const cancelManaging = () => {
    setIsManaging(false);
    setEditingTitle(false);
    setEditingScreenId(null);
    setIsAddingScreen(false);
    setNewSectionTitle('');
    setNewScreen({ title: '', content: '' });
    setEditScreenData({ title: '', content: '' });
  };

  const handleUpdateSectionTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionTitle.trim()) {
      setSectionTitle(newSectionTitle.trim());
      setEditingTitle(false);
    }
  };

  const handleAddScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (newScreen.title.trim() && newScreen.content.trim()) {
      const screen: CaffeineInfoScreen = {
        id: nextScreenId,
        title: newScreen.title.trim(),
        content: newScreen.content.trim()
      };
      setScreens([...screens, screen]);
      setNextScreenId(nextScreenId + 1);
      setNewScreen({ title: '', content: '' });
      setIsAddingScreen(false);
    }
  };

  const startEditScreen = (screen: CaffeineInfoScreen) => {
    setEditingScreenId(screen.id);
    setEditScreenData({ title: screen.title, content: screen.content });
  };

  const handleEditScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingScreenId !== null && editScreenData.title.trim() && editScreenData.content.trim()) {
      setScreens(screens.map(screen => 
        screen.id === editingScreenId 
          ? { ...screen, title: editScreenData.title.trim(), content: editScreenData.content.trim() }
          : screen
      ));
      setEditingScreenId(null);
      setEditScreenData({ title: '', content: '' });
    }
  };

  const handleDeleteScreen = (id: number) => {
    if (window.confirm('Are you sure you want to delete this screen?')) {
      const newScreens = screens.filter(screen => screen.id !== id);
      setScreens(newScreens);
      // Reset current index if we deleted the current screen
      if (currentInfoIndex >= newScreens.length) {
        setCurrentInfoIndex(0);
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
      minute: '2-digit'
    });
  };

  const currentScreen = screens[currentInfoIndex] || screens[0];

  return (
    <div 
      className="bg-slate-800 rounded-lg p-6 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
      onClick={handlePaneClick}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Coffee className="w-6 h-6 text-orange-400" />
              <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100">{sectionTitle}</h2>
          </div>
        </div>
        {isAdmin && !isEditing && !isManaging && (
          <button
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
        <div className="text-center py-8 text-slate-400">Loading caffeine information...</div>
      ) : isManaging ? (
        <div onClick={(e) => e.stopPropagation()} className="space-y-6">
          {/* Section Title Management */}
          <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
            <h3 className="text-lg font-medium text-slate-100 mb-3">Section Title</h3>
            {editingTitle ? (
              <form onSubmit={handleUpdateSectionTitle} className="flex gap-2">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTitle(false)}
                  className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{sectionTitle}</span>
                <button
                  onClick={() => setEditingTitle(true)}
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
              <h3 className="text-lg font-medium text-slate-100">Information Screens</h3>
              <button
                onClick={() => setIsAddingScreen(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Screen
              </button>
            </div>

            {/* Add New Screen Form */}
            {isAddingScreen && (
              <form onSubmit={handleAddScreen} className="mb-4 p-4 bg-slate-600 rounded border border-slate-500">
                <div className="mb-3">
                  <input
                    type="text"
                    value={newScreen.title}
                    onChange={(e) => setNewScreen({ ...newScreen, title: e.target.value })}
                    placeholder="Screen title"
                    className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-3">
                  <textarea
                    value={newScreen.content}
                    onChange={(e) => setNewScreen({ ...newScreen, content: e.target.value })}
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
                      setNewScreen({ title: '', content: '' });
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
              {screens.map((screen: CaffeineInfoScreen, index: number) => (
                <div key={screen.id} className="p-3 bg-slate-600 rounded border border-slate-500">
                  {editingScreenId === screen.id ? (
                    <form onSubmit={handleEditScreen}>
                      <div className="mb-3">
                        <input
                          type="text"
                          value={editScreenData.title}
                          onChange={(e) => setEditScreenData({ ...editScreenData, title: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-500 border border-slate-400 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <textarea
                          value={editScreenData.content}
                          onChange={(e) => setEditScreenData({ ...editScreenData, content: e.target.value })}
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
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingScreenId(null);
                            setEditScreenData({ title: '', content: '' });
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
                          <h4 className="font-medium text-slate-100 mb-1">{screen.title}</h4>
                          <p className="text-slate-300 text-sm line-clamp-2">{screen.content}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => startEditScreen(screen)}
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {screens.length > 1 && (
                            <button
                              onClick={() => handleDeleteScreen(screen.id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">Screen {index + 1} of {screens.length}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={cancelManaging}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded transition-colors"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      ) : isEditing && useLegacyMode ? (
        <form onSubmit={handleLegacySave} onClick={(e) => e.stopPropagation()}>
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
              {updateCaffeineInfo.isPending ? 'Saving...' : 'Save'}
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
                    isRotationPaused ? 'cursor-pointer hover:bg-slate-700 p-2 rounded transition-colors' : ''
                  }`}
                  onClick={handleTextClick}
                >
                  {currentScreen.content}
                </p>
              </>
            )}
          </div>
          
          {/* Progress indicator - clickable lines */}
          {screens.length > 1 && (
            <div className="flex gap-2 mb-4">
              {screens.map((_: CaffeineInfoScreen, index: number) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded transition-colors duration-300 cursor-pointer hover:opacity-80 ${
                    index === currentInfoIndex ? 'bg-blue-500' : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                  onClick={(e) => handleProgressClick(index, e)}
                  title={`Go to: ${screens[index]?.title || `Screen ${index + 1}`}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
