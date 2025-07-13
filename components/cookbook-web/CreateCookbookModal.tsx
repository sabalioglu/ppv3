// components/cookbook/CreateCookbookModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { COOKBOOK_COLORS, COOKBOOK_EMOJIS } from '@/types/cookbook';

interface CreateCookbookModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCookbookModal({ onClose, onSuccess }: CreateCookbookModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [selectedColor, setSelectedColor] = useState('#F97316');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('cookbooks')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          emoji: selectedEmoji,
          color: selectedColor,
          is_default: false
        });

      if (error) throw error;

      onSuccess();
    } catch (err) {
      console.error('Error creating cookbook:', err);
      setError('Failed to create cookbook. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Cookbook</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Italian Favorites"
              required
            />
          </div>

          {/* Description Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="A collection of my favorite Italian recipes"
              rows={2}
            />
          </div>

          {/* Emoji Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose an Emoji
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COOKBOOK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`p-2 text-2xl rounded hover:bg-gray-100 ${
                    selectedEmoji === emoji ? 'bg-orange-100 ring-2 ring-orange-500' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose a Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {COOKBOOK_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-10 rounded ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <div 
              className="flex items-center gap-3 p-3 rounded"
              style={{ backgroundColor: selectedColor + '20' }}
            >
              <span className="text-3xl">{selectedEmoji}</span>
              <div>
                <h3 className="font-medium">{name || 'Cookbook Name'}</h3>
                {description && (
                  <p className="text-sm text-gray-600">{description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Cookbook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
