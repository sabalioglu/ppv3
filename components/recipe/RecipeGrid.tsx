// components/recipe/RecipeGrid.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Flame } from 'lucide-react';
import { Recipe } from '@/types/recipe';

interface RecipeGridProps {
  recipes: Recipe[];
}

export function RecipeGrid({ recipes }: RecipeGridProps) {
  const isVideoOrGif = (url: string) => {
    return url?.match(/\.(mp4|webm|gif)$/i) || url?.includes('giphy.com');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {recipes.map((recipe) => (
        <Link 
          key={recipe.id} 
          to={`/recipe/${recipe.id}`}
          className="group"
        >
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* 16:9 Aspect Ratio Container */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <img
                src={recipe.thumbnail_url || recipe.image}
                alt={recipe.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80';
                }}
              />
              
              {/* Platform Badge */}
              {recipe.source_platform && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {recipe.source_platform}
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                {recipe.title}
              </h3>
              
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {recipe.prep_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{recipe.prep_time}m</span>
                  </div>
                )}
                
                {recipe.servings && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{recipe.servings}</span>
                  </div>
                )}
                
                {recipe.calories && (
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4" />
                    <span>{Math.round(recipe.calories)}</span>
                  </div>
                )}
              </div>

              {/* Nutrition badges */}
              {recipe.nutrition && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {recipe.nutrition.protein && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {Math.round(recipe.nutrition.protein)}g protein
                    </span>
                  )}
                  {recipe.nutrition.carbs && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {Math.round(recipe.nutrition.carbs)}g carbs
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
