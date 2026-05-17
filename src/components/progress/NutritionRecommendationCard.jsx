import React from 'react';

export default function NutritionRecommendationCard({ calorieAdjust }) {
  if (!calorieAdjust) return null;
  return (
    <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Goal-Aware Nutrition Recommendation</div>
      <p className="text-sm text-foreground">{calorieAdjust.note}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-secondary p-3">
          <div className="text-[11px] text-muted-foreground">Calories</div>
          <div className="text-sm font-bold text-foreground mt-1">{calorieAdjust.calories >= 0 ? '+' : ''}{calorieAdjust.calories} kcal</div>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <div className="text-[11px] text-muted-foreground">Protein</div>
          <div className="text-sm font-bold text-foreground mt-1">{calorieAdjust.protein >= 0 ? '+' : ''}{calorieAdjust.protein} g</div>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <div className="text-[11px] text-muted-foreground">Carbs</div>
          <div className="text-sm font-bold text-foreground mt-1">{calorieAdjust.carbs >= 0 ? '+' : ''}{calorieAdjust.carbs} g</div>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <div className="text-[11px] text-muted-foreground">Fat</div>
          <div className="text-sm font-bold text-foreground mt-1">{calorieAdjust.fat >= 0 ? '+' : ''}{calorieAdjust.fat} g</div>
        </div>
      </div>
    </div>
  );
}

