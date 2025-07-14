import React from 'react';
import { Book, MoreVertical } from 'lucide-react';
import { Cookbook } from '../../types/cookbook';

interface CookbookCardProps {
  cookbook: Cookbook;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CookbookCard({ cookbook, onClick, onEdit, onDelete }: CookbookCardProps) {
  return (
    <div
      className="cookbook-card"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div 
        className="cover-container"
        style={{ backgroundColor: cookbook.color || '#3B82F6' }}
      >
        {cookbook.cover_image ? (
          <img
            src={cookbook.cover_image}
            alt={cookbook.name}
            className="cover-image"
          />
        ) : (
          <span className="emoji">{cookbook.emoji || '📚'}</span>
        )}
        
        <div className="recipe-badge">
          <span className="recipe-count">{cookbook.recipe_count || 0} recipes</span>
        </div>
      </div>

      <div className="content">
        <h3 className="name">{cookbook.name}</h3>
        {cookbook.description && (
          <p className="description">
            {cookbook.description}
          </p>
        )}
      </div>

      {!cookbook.is_default && (onEdit || onDelete) && (
        <button
          className="menu-button"
          onClick={(e) => {
            e.stopPropagation();
            // Menu açma logic'i eklenecek
          }}
        >
          <MoreVertical size={16} />
        </button>
      )}

      <style jsx>{`
        .cookbook-card {
          width: calc(50% - 8px);
          background-color: white;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 16px;
          margin-right: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .cookbook-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .cover-container {
          height: 120px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .emoji {
          font-size: 48px;
        }

        .recipe-badge {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background-color: rgba(0, 0, 0, 0.5);
          border-radius: 8px;
          padding: 2px 8px;
        }

        .recipe-count {
          font-size: 12px;
          color: white;
          font-weight: 600;
        }

        .content {
          padding: 16px;
        }

        .name {
          font-size: 16px;
          font-weight: 600;
          color: #1F2937;
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .description {
          font-size: 14px;
          color: #6B7280;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .menu-button {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 14px;
          background-color: rgba(255, 255, 255, 0.9);
          border: none;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .menu-button:hover {
          background-color: rgba(255, 255, 255, 1);
        }
      `}</style>
    </div>
  );
}
