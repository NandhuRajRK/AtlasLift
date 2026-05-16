import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { getToday } from '@/lib/dateUtils';
import { X, UtensilsCrossed } from 'lucide-react';

export default function SavedMealPicker({ onClose }) {
  const { data: savedMeals } = useQuery({
    queryKey: ['savedMeals'],
    queryFn: () => appClient.entities.SavedMeal.list(),
    initialData: [],
  });

  const handleSelect = async (meal) => {
    await appClient.entities.MealLog.create({
      date: getToday(),
      name: meal.name,
      mealType: meal.defaultMealType || 'other',
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
    });
    onClose();
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Saved Meals</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {savedMeals.length > 0 ? (
        <div className="space-y-2">
          {savedMeals.map(meal => (
            <button key={meal.id} onClick={() => handleSelect(meal)}
              className="w-full text-left bg-card rounded-xl p-4 border border-border active:scale-[0.98] transition-transform">
              <div className="text-sm font-semibold text-foreground">{meal.name}</div>
              <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                <span>{meal.calories} kcal</span>
                <span>P: {meal.protein}g</span>
                <span>C: {meal.carbs}g</span>
                <span>F: {meal.fat}g</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No saved meals yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Save a meal as template when logging.</p>
        </div>
      )}
    </div>
  );
}