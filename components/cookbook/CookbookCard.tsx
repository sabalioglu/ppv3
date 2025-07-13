// components/cookbook/CookbookCard.tsx
import React from 'react';
import { Book, MoreVertical } from 'lucide-react';
import { Cookbook } from '@/types/cookbook';

interface CookbookCardProps {
  cookbook: Cookbook;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CookbookCard({ cookbook, onClick, onEdit, onDelete }: CookbookCardProps) {
  const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      onClick={onClick}
      className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden h-48 cursor-pointer group"
    >
      {/* Cover Image or Color Background */}
      <div 
        className="h-32 relative flex items-center justify-center"
        style={{ backgroundColor: cookbook.color || '#F97316' }}
      >
        {cookbook.cover_image ? (
          <img
            src={cookbook.cover_image}
            alt={cookbook.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">{cookbook.emoji || '📚'}</span>
        )}
        
        {/* Recipe count badge */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          {cookbook.recipe_count || 0} recipes
        </div>
      </div>

      {/* Cookbook Info */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate">{cookbook.name}</h3>
        {cookbook.description && (
          <p className="text-sm text-gray-500 truncate">{cookbook.description}</p>
        )}
      </div>

      {/* Options Menu (only for non-default cookbooks) */}
      {!cookbook.is_default && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 bg-white rounded-full shadow-md hover:shadow-lg"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
