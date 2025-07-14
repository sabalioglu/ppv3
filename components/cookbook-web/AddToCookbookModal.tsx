// components/cookbook-web/AddToCookbookModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Book } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Cookbook } from '@/types/cookbook';

interface AddToCookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
  onCreateNewCookbook?: () => void;
}

export function AddToCookbookModal({ 
  isOpen, 
  onClose, 
  recipeId,
  recipeTitle,
  onCreateNewCookbook 
}: AddToCookbookModalProps) {
  const { user } = useAuth();
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [selectedCookbooks, setSelectedCookbooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialCookbooks, setInitialCookbooks] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && user && recipeId) {
      loadCookbooksAndRecipeAssociations();
    }
  }, [isOpen, user, recipeId]);

  const loadCookbooksAndRecipeAssociations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user's cookbooks with recipe count
      const { data: cookbooksData, error: cookbooksError } = await supabase
        .from('cookbooks')
        .select('*, recipe_count:recipe_cookbooks(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cookbooksError) throw cookbooksError;

      // Process cookbook data
      const processedCookbooks = cookbooksData?.map(cookbook => ({
        ...cookbook,
        recipe_count: cookbook.recipe_count?.[0]?.count || 0
      })) || [];

      setCookbooks(processedCookbooks);

      // Load existing associations
      const { data: associations, error: assocError } = await supabase
        .from('recipe_cookbooks')
        .select('cookbook_id')
        .eq('recipe_id', recipeId);

      if (assocError) throw assocError;

      const associatedCookbookIds = associations?.map(a => a.cookbook_id) || [];
      setSelectedCookbooks(associatedCookbookIds);
      setInitialCookbooks(associatedCookbookIds);

    } catch (error) {
      console.error('Error loading cookbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCookbook = (cookbookId: string) => {
    setSelectedCookbooks(prev => {
      if (prev.includes(cookbookId)) {
        return prev.filter(id => id !== cookbookId);
      }
      return [...prev, cookbookId];
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Check if any changes were made
      const hasChanges = 
        selectedCookbooks.length !== initialCookbooks.length ||
        selectedCookbooks.some(id => !initialCookbooks.includes(id)) ||
        initialCookbooks.some(id => !selectedCookbooks.includes(id));

      if (!hasChanges) {
        onClose();
        return;
      }

      // Determine which to add and remove
      const toAdd = selectedCookbooks.filter(id => !initialCookbooks.includes(id));
      const toRemove = initialCookbooks.filter(id => !selectedCookbooks.includes(id));

      // Batch operations
      const operations = [];

      if (toRemove.length > 0) {
        operations.push(
          supabase
            .from('recipe_cookbooks')
            .delete()
            .eq('recipe_id', recipeId)
            .in('cookbook_id', toRemove)
        );
      }

      if (toAdd.length > 0) {
        const newAssociations = toAdd.map(cookbookId => ({
          recipe_id: recipeId,
          cookbook_id: cookbookId,
        }));

        operations.push(
          supabase
            .from('recipe_cookbooks')
            .insert(newAssociations)
        );
      }

      const results = await Promise.all(operations);
      const hasError = results.some(result => result.error);

      if (hasError) {
        throw new Error('Failed to update some cookbooks');
      }

      onClose();
    } catch (error) {
      console.error('Error saving cookbook associations:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewCookbook = () => {
    onClose();
    if (onCreateNewCookbook) {
      setTimeout(onCreateNewCookbook, 100);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b">
          <div className="flex-1 mr-4">
            <h2 className="text-xl font-semibold text-gray-800">Add to Cookbook</h2>
            <p className="text-sm text-gray-500 mt-1 truncate">{recipeTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create New Cookbook Button */}
          <button
            onClick={handleCreateNewCookbook}
            className="w-full flex items-center gap-3 p-4 mb-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Plus className="h-4 w-4 text-orange-600" />
            </div>
            <span className="font-medium text-orange-700">Create New Cookbook</span>
          </button>

          {/* Cookbooks List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : cookbooks.length === 0 ? (
            <div className="text-center py-12">
              <Book className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No cookbooks yet. Create your first cookbook!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cookbooks.map((cookbook) => {
                const isSelected = selectedCookbooks.includes(cookbook.id);
                return (
                  <button
                    key={cookbook.id}
                    onClick={() => toggleCookbook(cookbook.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'bg-orange-50 border-orange-200' 
                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cookbook.emoji || '📚'}</span>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-800">{cookbook.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {cookbook.description && (
                            <span className="truncate max-w-[150px]">{cookbook.description}</span>
                          )}
                          <span>{cookbook.recipe_count || 0} recipes</span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-orange-500 border-orange-500' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
