import React, { useState, useEffect } from 'react';
import { useGetAllWebLinks, useAddWebLink, useEditWebLink, useDeleteWebLink, useReorderWebLinks } from '../hooks/useQueries';
import { WebLink } from '../backend';
import { Plus, Edit2, Trash2, Save, X, ExternalLink, Link, GripVertical, ArrowUpDown } from 'lucide-react';

interface LinksSectionProps {
  isAdmin: boolean;
}

export default function LinksSection({ isAdmin }: LinksSectionProps) {
  const { data: webLinks = [], isLoading, refetch } = useGetAllWebLinks();
  const addWebLink = useAddWebLink();
  const editWebLink = useEditWebLink();
  const deleteWebLink = useDeleteWebLink();
  const reorderWebLinks = useReorderWebLinks();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [newLink, setNewLink] = useState({ title: '', url: '', description: '' });
  const [editLink, setEditLink] = useState({ title: '', url: '', description: '' });
  
  // Reordering mode state
  const [isReorderingMode, setIsReorderingMode] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<WebLink[]>([]);
  const [tempOrder, setTempOrder] = useState<WebLink[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Enhanced drag and drop state for real-time feedback
  const [draggedItem, setDraggedItem] = useState<WebLink | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Update tempOrder when webLinks changes and we're not in reordering mode
  useEffect(() => {
    if (!isReorderingMode) {
      setTempOrder([...webLinks]);
    }
  }, [webLinks, isReorderingMode]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newLink.title.trim() && newLink.url.trim()) {
      try {
        await addWebLink.mutateAsync({
          title: newLink.title.trim(),
          url: newLink.url.trim(),
          description: newLink.description.trim()
        });
        setNewLink({ title: '', url: '', description: '' });
        setIsAdding(false);
      } catch (error) {
        console.error('Failed to add web link:', error);
      }
    }
  };

  const handleEditLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure we have valid data before proceeding
    if (!editingId || !editLink.title.trim() || !editLink.url.trim()) {
      console.error('Invalid edit data:', { editingId, editLink });
      return;
    }

    try {
      // Create the mutation payload with explicit type conversion
      const mutationPayload = {
        id: editingId,
        title: editLink.title.trim(),
        url: editLink.url.trim(),
        description: editLink.description.trim() || '' // Ensure description is never undefined
      };

      console.log('Saving link edit:', mutationPayload);
      
      // Execute the mutation and wait for completion
      await editWebLink.mutateAsync(mutationPayload);
      
      console.log('Link edit saved successfully');
      
      // Only reset state after successful mutation
      setEditingId(null);
      setEditLink({ title: '', url: '', description: '' });
      
    } catch (error) {
      console.error('Failed to edit web link:', error);
      // Don't reset state on error so user can retry
    }
  };

  const startEdit = (link: WebLink) => {
    console.log('Starting edit for link:', link);
    setEditingId(link.id);
    setEditLink({ 
      title: link.title, 
      url: link.url, 
      description: link.description || '' // Ensure description is never undefined
    });
  };

  const cancelEdit = () => {
    console.log('Cancelling edit');
    setEditingId(null);
    setEditLink({ title: '', url: '', description: '' });
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewLink({ title: '', url: '', description: '' });
  };

  const handleDelete = async (id: bigint) => {
    if (window.confirm('Are you sure you want to delete this link?')) {
      try {
        await deleteWebLink.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete web link:', error);
      }
    }
  };

  // Reordering mode functions
  const enterReorderingMode = () => {
    // Create a copy of the current webLinks order - preserve the exact order from backend
    const currentOrder = [...webLinks];
    setOriginalOrder(currentOrder);
    setTempOrder(currentOrder);
    setIsReorderingMode(true);
  };

  const exitReorderingMode = () => {
    setIsReorderingMode(false);
    setOriginalOrder([]);
    setTempOrder([]);
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDragging(false);
    setIsSaving(false);
  };

  const saveNewOrder = async () => {
    try {
      setIsSaving(true);
      
      // Extract the IDs in the exact order they appear in tempOrder
      const newOrderIds = tempOrder.map(link => link.id);
      console.log('Saving new order (exact tempOrder):', newOrderIds);
      console.log('Original order was:', originalOrder.map(link => link.id));
      
      // Reverse the array before sending to backend to ensure the saved order matches the UI
      const reversedOrderIds = [...newOrderIds].reverse();
      console.log('Sending reversed order to backend:', reversedOrderIds);
      
      // Call the backend to save the new order
      await reorderWebLinks.mutateAsync(reversedOrderIds);
      
      console.log('New order saved successfully');
      
      // Exit reordering mode first to prevent animations
      exitReorderingMode();
      
      // Force a refetch to ensure we have the latest data from backend
      await refetch();
      
    } catch (error) {
      console.error('Reorder failed:', error);
      setIsSaving(false);
      // Don't exit reordering mode on error so user can retry
    }
  };

  const cancelReordering = () => {
    // Reset to original order
    setTempOrder([...originalOrder]);
    exitReorderingMode();
  };

  // Enhanced drag and drop handlers with real-time preview
  const handleDragStart = (e: React.DragEvent, link: WebLink) => {
    if (!isAdmin || !isReorderingMode || editingId === link.id || isSaving) return;
    
    setDraggedItem(link);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', link.id.toString());
    
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
    target.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    target.classList.remove('dragging');
    
    // Reset drag state
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isAdmin || !isReorderingMode || !draggedItem || editingId !== null || isSaving) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Update drag over index and create real-time preview
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
      
      // Create preview order for real-time feedback
      const currentOrder = [...tempOrder];
      const dragIndex = currentOrder.findIndex(link => link.id === draggedItem.id);
      
      if (dragIndex !== -1 && dragIndex !== index) {
        // Remove dragged item from current position
        const [draggedLink] = currentOrder.splice(dragIndex, 1);
        // Insert at new position
        currentOrder.splice(index, 0, draggedLink);
        setTempOrder(currentOrder);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    if (!isAdmin || !isReorderingMode || !draggedItem || editingId !== null || isSaving) return;
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the container entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      // Don't clear preview order here to maintain visual feedback
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!isAdmin || !isReorderingMode || !draggedItem || editingId !== null || isSaving) {
      setDragOverIndex(null);
      setIsDragging(false);
      return;
    }

    const dragIndex = tempOrder.findIndex(link => link.id === draggedItem.id);
    
    // If dropping in the same position, do nothing
    if (dragIndex === dropIndex) {
      setDragOverIndex(null);
      setIsDragging(false);
      setDraggedItem(null);
      return;
    }

    // The order has already been updated in handleDragOver, so just reset drag state
    setDragOverIndex(null);
    setIsDragging(false);
    setDraggedItem(null);
  };

  // Determine which order to display: temp order in reordering mode or actual data
  const displayOrder = isReorderingMode ? tempOrder : webLinks;

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-3">
            <Link className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-slate-100">Links</h2>
          </div>
        </div>
        {isAdmin && !isReorderingMode && (
          <div className="flex gap-2">
            {webLinks.length > 1 && (
              <button
                onClick={enterReorderingMode}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                Change Order
              </button>
            )}
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Link
            </button>
          </div>
        )}
        {isAdmin && isReorderingMode && (
          <div className="flex gap-2">
            <button
              onClick={saveNewOrder}
              disabled={isSaving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={cancelReordering}
              disabled={isSaving}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Reordering mode indicator */}
      {isReorderingMode && (
        <div className="mb-4 p-3 bg-purple-900/30 border border-purple-600/50 rounded-lg">
          <div className="flex items-center gap-2 text-purple-300">
            <GripVertical className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isSaving ? 'Saving Order...' : 'Reordering Mode Active'}
            </span>
          </div>
          <p className="text-xs text-purple-400 mt-1">
            {isSaving 
              ? 'Please wait while the new order is being saved...'
              : 'Drag and drop links to rearrange them. Position numbers show the final order after saving. Click "Save" to keep changes or "Cancel" to discard.'
            }
          </p>
        </div>
      )}

      {/* Add New Link Form */}
      {isAdmin && isAdding && !isReorderingMode && (
        <form onSubmit={handleAddLink} className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              placeholder="Link title"
              className="px-3 py-2 bg-slate-600 border border-slate-500 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://example.com"
              className="px-3 py-2 bg-slate-600 border border-slate-500 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={newLink.description}
              onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addWebLink.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-2 rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              {addWebLink.isPending ? 'Saving...' : 'Save'}
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

      {/* Links */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Loading links...</div>
        ) : displayOrder.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No links yet.</div>
        ) : (
          displayOrder.map((link, index) => {
            const isDraggedItem = draggedItem?.id === link.id;
            const isDropTarget = dragOverIndex === index && !isDraggedItem;
            const isPreviewTarget = isDragging && !isDraggedItem && isReorderingMode;
            
            return (
              <div
                key={link.id.toString()}
                className={`link-item bg-slate-700 rounded-lg p-4 border transition-all duration-200 ${
                  isAdmin && isReorderingMode && editingId !== link.id && !isSaving ? 'cursor-move' : ''
                } ${
                  isDropTarget ? 'drop-zone drag-over border-blue-500 bg-slate-600 transform scale-105' : 'border-slate-600'
                } ${
                  isDraggedItem ? 'dragging opacity-50 transform rotate-2 scale-105' : ''
                } ${
                  isPreviewTarget ? 'drag-preview-target border-blue-400 bg-slate-650 transform translateX-1' : ''
                } ${
                  isSaving ? 'saving-state' : ''
                }`}
                draggable={isAdmin && isReorderingMode && editingId !== link.id && !isSaving}
                onDragStart={(e) => handleDragStart(e, link)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
              >
                {editingId === link.id && !isReorderingMode ? (
                  <form onSubmit={handleEditLink} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editLink.title}
                        onChange={(e) => setEditLink({ ...editLink, title: e.target.value })}
                        className="px-3 py-2 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Link title"
                      />
                      <input
                        type="url"
                        value={editLink.url}
                        onChange={(e) => setEditLink({ ...editLink, url: e.target.value })}
                        className="px-3 py-2 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={editLink.description}
                        onChange={(e) => setEditLink({ ...editLink, description: e.target.value })}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={editWebLink.isPending}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-2 rounded transition-colors text-sm"
                      >
                        <Save className="w-4 h-4" />
                        {editWebLink.isPending ? 'Saving...' : 'Save Changes'}
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
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {isAdmin && isReorderingMode && editingId !== link.id && !isSaving && (
                        <div className="flex-shrink-0 mt-1 drag-handle">
                          <GripVertical className="w-4 h-4 text-slate-400 hover:text-slate-200 transition-colors" />
                        </div>
                      )}
                      {isReorderingMode && (
                        <div className="flex-shrink-0 mt-1">
                          <div className="position-indicator bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {index + 1}
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-1"
                          >
                            {link.title}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        {link.description && (
                          <p className="text-slate-300 text-sm mb-1">{link.description}</p>
                        )}
                        <p className="text-slate-400 text-xs break-all">{link.url}</p>
                      </div>
                    </div>
                    {isAdmin && !isReorderingMode && (
                      <div className="flex gap-1 ml-4">
                        <button
                          onClick={() => startEdit(link)}
                          className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                          title="Edit link"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
