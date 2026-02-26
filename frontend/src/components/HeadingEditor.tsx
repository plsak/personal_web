import React, { useState } from 'react';
import { useGetHeadingConfig, useUpdateHeadingConfig } from '../hooks/useQueries';
import { Edit2, Save, X, Type, Palette } from 'lucide-react';

const FONT_OPTIONS = [
  { value: 'cursive', label: 'Cursive', className: 'cursive-font' },
  { value: 'serif', label: 'Serif', className: 'serif-font' },
  { value: 'sans-serif', label: 'Sans Serif', className: 'sans-serif-font' },
  { value: 'monospace', label: 'Monospace', className: 'monospace-font' },
  { value: 'fantasy', label: 'Fantasy', className: 'fantasy-font' }
];

const COLOR_OPTIONS = [
  { value: '#f1f5f9', label: 'Light Gray', color: '#f1f5f9' },
  { value: '#ffffff', label: 'White', color: '#ffffff' },
  { value: '#3b82f6', label: 'Blue', color: '#3b82f6' },
  { value: '#8b5cf6', label: 'Purple', color: '#8b5cf6' },
  { value: '#10b981', label: 'Green', color: '#10b981' },
  { value: '#f59e0b', label: 'Orange', color: '#f59e0b' },
  { value: '#ef4444', label: 'Red', color: '#ef4444' },
  { value: '#ec4899', label: 'Pink', color: '#ec4899' },
  { value: '#06b6d4', label: 'Cyan', color: '#06b6d4' },
  { value: '#84cc16', label: 'Lime', color: '#84cc16' }
];

export default function HeadingEditor() {
  const { data: headingConfig } = useGetHeadingConfig();
  const updateHeadingConfig = useUpdateHeadingConfig();
  
  const [isOpen, setIsOpen] = useState(false);
  const [headingText, setHeadingText] = useState('');
  const [selectedFont, setSelectedFont] = useState('cursive');
  const [selectedColor, setSelectedColor] = useState('#f1f5f9');
  const [error, setError] = useState('');

  const handleOpen = () => {
    // Initialize form with current values
    setHeadingText(headingConfig?.text || "plsak with caffeine.ai");
    setSelectedFont(headingConfig?.font || "cursive");
    setSelectedColor(headingConfig?.color || "#f1f5f9");
    setError('');
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!headingText.trim()) {
      setError('Heading text cannot be empty');
      return;
    }

    try {
      await updateHeadingConfig.mutateAsync({
        text: headingText.trim(),
        font: selectedFont,
        color: selectedColor
      });
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update heading');
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setError('');
  };

  const getPreviewFontClass = (font: string) => {
    const option = FONT_OPTIONS.find(f => f.value === font);
    return option?.className || 'cursive-font';
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
        title="Edit Heading"
      >
        <Edit2 className="w-3 h-3" />
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Type className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-slate-100">Edit Page Heading</h2>
              </div>
              <button
                onClick={handleCancel}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Heading Text */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Heading Text
                </label>
                <input
                  type="text"
                  value={headingText}
                  onChange={(e) => setHeadingText(e.target.value)}
                  placeholder="Enter heading text"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Font Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Font Style
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => setSelectedFont(font.value)}
                      className={`p-3 rounded border text-left transition-colors ${
                        selectedFont === font.value
                          ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                          : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className={`text-lg ${font.className}`}>
                        Aa
                      </div>
                      <div className="text-xs mt-1">{font.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Text Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`p-2 rounded border transition-colors ${
                        selectedColor === color.value
                          ? 'border-blue-500 bg-blue-600/20'
                          : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                      }`}
                      title={color.label}
                    >
                      <div
                        className="w-8 h-8 rounded mx-auto"
                        style={{ backgroundColor: color.color }}
                      />
                      <div className="text-xs mt-1 text-slate-300">{color.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-slate-700 rounded border border-slate-600">
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Preview
                </label>
                <div className="text-center">
                  <h1 
                    className={`text-3xl font-bold ${getPreviewFontClass(selectedFont)}`}
                    style={{ color: selectedColor }}
                  >
                    {headingText || "plsak with caffeine.ai"}
                  </h1>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={updateHeadingConfig.isPending}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {updateHeadingConfig.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
