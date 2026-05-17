import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Smile,
  Underline,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import EmojiPicker from "./EmojiPicker";
// Strip text-align: justify from any HTML string using DOMParser when available.
// This prevents the editor from ever persisting justify alignment to the backend.
function stripJustifyFromHTML(html: string): string {
  if (!html) return html;
  try {
    const doc = new DOMParser().parseFromString(
      `<body>${html}</body>`,
      "text/html",
    );
    for (const el of doc.body.querySelectorAll<HTMLElement>("[style]")) {
      const align = el.style.textAlign;
      if (align === "justify" || align === "-moz-center") {
        el.style.removeProperty("text-align");
        if (!el.getAttribute("style")?.trim()) el.removeAttribute("style");
      }
    }
    return doc.body.innerHTML;
  } catch {
    return html.replace(
      /(<[^>]+style\s*=\s*["'][^"']*)text-align\s*:\s*justify\s*;?/gi,
      "$1",
    );
  }
}

const FONT_OPTIONS = [
  { value: "cursive", label: "Cursive", className: "cursive-font" },
  { value: "serif", label: "Serif", className: "serif-font" },
  { value: "sans-serif", label: "Sans Serif", className: "sans-serif-font" },
  { value: "monospace", label: "Monospace", className: "monospace-font" },
  { value: "fantasy", label: "Fantasy", className: "fantasy-font" },
];

const COLOR_PRESETS = [
  "#f1f5f9",
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#ef4444",
  "#eab308",
  "#06b6d4",
  "#ffffff",
];

interface UnifiedTextEditorProps {
  /** HTML string value */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Show alignment controls (left / center / right) */
  alignmentControl?: boolean;
  selectedAlignment?: "left" | "center" | "right";
  onAlignmentChange?: (a: "left" | "center" | "right") => void;
  /** Show font-style picker */
  showFontPicker?: boolean;
  selectedFont?: string;
  onFontChange?: (font: string) => void;
  /** Show text-color picker */
  showColorPicker?: boolean;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
  className?: string;
  minRows?: number;
}

/**
 * Unified rich-text editor used across the whole app.
 * Toolbar: Font Style | Text Color | Bold | Italic | Underline | Link | Bullet List | Numbered List | Emoji
 * Alignment row (optional) is rendered below the toolbar.
 */
export default function UnifiedTextEditor({
  value,
  onChange,
  placeholder,
  alignmentControl = false,
  selectedAlignment = "center",
  onAlignmentChange,
  showFontPicker = false,
  selectedFont = "sans-serif",
  onFontChange,
  showColorPicker = false,
  selectedColor = "#f1f5f9",
  onColorChange,
  className,
  minRows = 4,
}: UnifiedTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [customPickerColor, setCustomPickerColor] = useState(
    selectedColor || "#000000",
  );

  // Sync external value into contenteditable only when it changes from outside
  useEffect(() => {
    if (!editorRef.current) return;
    if (!isInternalChange.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    isInternalChange.current = false;
  }, [value]);

  // Track active formatting states (bold/italic/underline) based on selection
  useEffect(() => {
    const updateFormats = () => {
      const formats = new Set<string>();
      try {
        if (document.queryCommandState("bold")) formats.add("bold");
        if (document.queryCommandState("italic")) formats.add("italic");
        if (document.queryCommandState("underline")) formats.add("underline");
      } catch {
        // queryCommandState may throw in some environments
      }
      setActiveFormats(formats);
    };
    document.addEventListener("selectionchange", updateFormats);
    return () => document.removeEventListener("selectionchange", updateFormats);
  }, []);

  // Close font dropdown when clicking outside
  useEffect(() => {
    if (!showFontDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        fontDropdownRef.current &&
        !fontDropdownRef.current.contains(e.target as Node)
      ) {
        setShowFontDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showFontDropdown]);

  // Save the current selection range so we can restore it after picker interaction
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  // Restore a previously saved selection range
  const restoreSelection = useCallback(() => {
    const range = savedRangeRef.current;
    if (!range) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  const execCmd = useCallback(
    (cmd: string, val?: string) => {
      // Focus the editor first so execCommand applies to the right context.
      // If there is no selection, execCommand will toggle the state so the
      // next characters typed are in the chosen format (bold / italic / underline).
      editorRef.current?.focus();
      document.execCommand(cmd, false, val ?? "");
      // Update active-format state immediately so the toolbar highlights
      // correctly even when no text is selected
      const formats = new Set<string>();
      try {
        if (document.queryCommandState("bold")) formats.add("bold");
        if (document.queryCommandState("italic")) formats.add("italic");
        if (document.queryCommandState("underline")) formats.add("underline");
      } catch {
        // queryCommandState may throw in some environments
      }
      setActiveFormats(formats);
      if (editorRef.current) {
        isInternalChange.current = true;
        onChange(editorRef.current.innerHTML);
      }
    },
    [onChange],
  );

  const handleLink = useCallback(() => {
    const selection = window.getSelection();
    let existingUrl = "";
    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeName === "A") {
          existingUrl = (node as HTMLAnchorElement).href || "";
          break;
        }
        node = node.parentNode;
      }
    }
    const raw = window.prompt("Enter URL:", existingUrl);
    if (raw === null) return; // cancelled
    const url =
      raw.trim() && !raw.trim().match(/^https?:\/\//i)
        ? `https://${raw.trim()}`
        : raw.trim();
    if (url) execCmd("createLink", url);
  }, [execCmd]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      // Strip any justify alignment that may have been pasted in or generated
      // by the browser — never let text-align: justify into stored content.
      const raw = editorRef.current.innerHTML;
      const cleaned = stripJustifyFromHTML(raw);
      if (cleaned !== raw) {
        // Rewrite the DOM without the justify styles so future serialisations
        // are also clean. This does not move the caret in practice because we
        // only remove style properties, never restructure nodes.
        editorRef.current.innerHTML = cleaned;
      }
      onChange(cleaned);
    }
  };

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      // Restore saved selection so the emoji goes into the right spot
      restoreSelection();
      editorRef.current?.focus();
      document.execCommand("insertText", false, emoji);
      if (editorRef.current) {
        isInternalChange.current = true;
        onChange(editorRef.current.innerHTML);
      }
      setShowEmojiPicker(false);
    },
    [restoreSelection, onChange],
  );

  // When color changes, apply it as foreground color to selected text
  const handleColorChange = useCallback(
    (color: string) => {
      onColorChange?.(color);
      // Apply color to any currently selected text in this editor
      if (editorRef.current) {
        const sel = window.getSelection();
        if (
          sel &&
          sel.rangeCount > 0 &&
          editorRef.current.contains(sel.anchorNode)
        ) {
          document.execCommand("foreColor", false, color);
          isInternalChange.current = true;
          onChange(editorRef.current.innerHTML);
        }
      }
    },
    [onColorChange, onChange],
  );

  // When font changes, apply it to selected text
  const handleFontChange = useCallback(
    (font: string) => {
      onFontChange?.(font);
      if (editorRef.current) {
        const sel = window.getSelection();
        if (
          sel &&
          sel.rangeCount > 0 &&
          editorRef.current.contains(sel.anchorNode)
        ) {
          document.execCommand("fontName", false, font);
          isInternalChange.current = true;
          onChange(editorRef.current.innerHTML);
        }
      }
    },
    [onFontChange, onChange],
  );

  const minHeight = `${minRows * 1.6}rem`;

  const currentFontLabel =
    FONT_OPTIONS.find((f) => f.value === selectedFont)?.label ?? "Sans Serif";

  return (
    <div
      className={`border border-slate-400 rounded overflow-visible ${className ?? ""}`}
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 p-1 bg-slate-600 border-b border-slate-500">
        {/* Font Style picker */}
        {showFontPicker && (
          <div className="relative" ref={fontDropdownRef}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowFontDropdown((v) => !v);
              }}
              className="px-2 py-1 rounded text-xs bg-slate-500 hover:bg-slate-400 text-slate-200 transition-colors min-w-[80px] text-left"
              title="Font Style"
            >
              {currentFontLabel}
            </button>
            {showFontDropdown && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-slate-700 border border-slate-500 rounded shadow-xl min-w-[120px]">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleFontChange(font.value);
                      setShowFontDropdown(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                      selectedFont === font.value
                        ? "bg-blue-600 text-white"
                        : "text-slate-200 hover:bg-slate-600"
                    }`}
                  >
                    <span className={font.className}>{font.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Text Color */}
        {showColorPicker && (
          <div className="flex items-center gap-1 px-1">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleColorChange(c);
                }}
                className={`w-4 h-4 rounded-full border transition-transform hover:scale-110 ${
                  selectedColor === c
                    ? "border-white scale-110"
                    : "border-slate-400"
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <div className="flex items-center gap-0.5">
              <input
                type="color"
                value={customPickerColor}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  setCustomPickerColor(e.target.value);
                }}
                className="w-5 h-5 rounded cursor-pointer border border-slate-500 bg-transparent"
                title="Custom color — click Apply to apply"
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleColorChange(customPickerColor);
                }}
                className="px-1.5 py-0.5 rounded text-xs bg-slate-500 hover:bg-blue-600 text-slate-200 hover:text-white transition-colors"
                title="Apply custom color to selected text"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {(showFontPicker || showColorPicker) && (
          <div className="w-px bg-slate-500 mx-0.5 self-stretch" />
        )}

        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("bold");
          }}
          className={`p-1 rounded transition-colors ${
            activeFormats.has("bold")
              ? "bg-blue-600 text-white"
              : "hover:bg-slate-500 text-slate-200"
          }`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("italic");
          }}
          className={`p-1 rounded transition-colors ${
            activeFormats.has("italic")
              ? "bg-blue-600 text-white"
              : "hover:bg-slate-500 text-slate-200"
          }`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("underline");
          }}
          className={`p-1 rounded transition-colors ${
            activeFormats.has("underline")
              ? "bg-blue-600 text-white"
              : "hover:bg-slate-500 text-slate-200"
          }`}
          title="Underline"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="w-px bg-slate-500 mx-0.5" />

        {/* Hyperlink */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleLink();
          }}
          className="p-1 rounded hover:bg-slate-500 text-slate-200 transition-colors"
          title="Insert Hyperlink"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px bg-slate-500 mx-0.5" />

        {/* Bullet List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("insertUnorderedList");
          }}
          className="p-1 rounded hover:bg-slate-500 text-slate-200 transition-colors"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("insertOrderedList");
          }}
          className="p-1 rounded hover:bg-slate-500 text-slate-200 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="w-px bg-slate-500 mx-0.5" />

        {/* Emoji Picker */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              // Save selection before the picker opens (focus will stay on editor)
              saveSelection();
              setShowEmojiPicker((v) => !v);
            }}
            className="p-1 rounded hover:bg-slate-500 text-slate-200 transition-colors"
            title="Insert Emoji"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
          {showEmojiPicker && (
            <div
              className="absolute top-full right-0 mt-1"
              style={{ zIndex: 9999 }}
            >
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>

        {/* Alignment */}
        {alignmentControl && (
          <>
            <div className="w-px bg-slate-500 mx-0.5" />
            {(["left", "center", "right"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onAlignmentChange?.(a);
                }}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  selectedAlignment === a
                    ? "bg-blue-600 text-white"
                    : "bg-slate-500 text-slate-300 hover:bg-slate-400"
                }`}
                title={`Align ${a}`}
              >
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </>
        )}
      </div>

      {/* ── Editable Area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        data-placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-500 text-slate-100 focus:outline-none text-sm rich-text-content rich-text-editor"
        style={{ minHeight, overflowY: "auto" }}
      />
    </div>
  );
}
