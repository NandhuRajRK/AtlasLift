import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { getToday } from '@/lib/dateUtils';
import MacroBar from '@/components/ui/MacroBar';
import GradientButton from '@/components/ui/GradientButton';
import MealForm from '@/components/meals/MealForm';
import SavedMealPicker from '@/components/meals/SavedMealPicker';
import { Plus, Bookmark, Trash2, UtensilsCrossed, Pencil, RotateCcw } from 'lucide-react';
import { selectPrimaryProfile } from '@/lib/profileUtils';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { format, subDays } from 'date-fns';

const MEAL_TYPE_LABELS = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
  pre_workout: 'Pre-Workout', post_workout: 'Post-Workout', other: 'Other',
};

export default function Meals() {
  const today = getToday();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [deleteTimers, setDeleteTimers] = useState({});
  const [mealVisibleCount, setMealVisibleCount] = useState(8);

  const { data: profiles } = useQuery({ queryKey: ['userProfile'], queryFn: () => appClient.entities.UserProfile.list('-created_date', 50), initialData: [] });
  const profile = selectPrimaryProfile(profiles) || {};

  const { data: meals } = useQuery({
    queryKey: ['meals', today],
    queryFn: () => appClient.entities.MealLog.filter({ date: today }),
    initialData: [],
  });
  const { data: allMeals, refetch: refetchAllMeals, isLoading: mealsLoading, isError: mealsError } = useQuery({
    queryKey: ['allMeals'],
    queryFn: () => appClient.entities.MealLog.list('-created_date', 1000),
    initialData: [],
  });

  const deleteMeal = useMutation({
    mutationFn: (id) => appClient.entities.MealLog.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meals', today] }),
  });

  const visibleMeals = meals.filter((m) => !pendingDeleteIds.includes(m.id));
  const pagedMeals = visibleMeals.slice(0, mealVisibleCount);

  const totalCals = visibleMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = visibleMeals.reduce((s, m) => s + (m.protein || 0), 0);
  const totalCarbs = visibleMeals.reduce((s, m) => s + (m.carbs || 0), 0);
  const totalFat = visibleMeals.reduce((s, m) => s + (m.fat || 0), 0);
  const calTarget = profile.calorieTarget || 2200;
  const proTarget = profile.proteinTarget || 160;

  const closeMealForm = () => { setShowForm(false); setEditingMeal(null); queryClient.invalidateQueries({ queryKey: ['meals', today] }); };
  if (showForm || editingMeal) return <MealForm onClose={closeMealForm} editMeal={editingMeal} />;
  if (showSaved) return <SavedMealPicker onClose={() => { setShowSaved(false); queryClient.invalidateQueries({ queryKey: ['meals', today] }); }} />;

  const queueDeleteMeal = (meal) => {
    if (pendingDeleteIds.includes(meal.id)) return;
    setPendingDeleteIds((prev) => [...prev, meal.id]);
    const timer = setTimeout(async () => {
      await deleteMeal.mutateAsync(meal.id);
      setPendingDeleteIds((prev) => prev.filter((id) => id !== meal.id));
      setDeleteTimers((prev) => {
        const next = { ...prev };
        delete next[meal.id];
        return next;
      });
    }, 5000);
    setDeleteTimers((prev) => ({ ...prev, [meal.id]: timer }));
    toast({
      title: 'Meal removed',
      description: `${meal.name} will be deleted.`,
      action: (
        <ToastAction onClick={() => {
          clearTimeout(timer);
          setPendingDeleteIds((prev) => prev.filter((id) => id !== meal.id));
          setDeleteTimers((prev) => {
            const next = { ...prev };
            delete next[meal.id];
            return next;
          });
        }}>
          Undo
        </ToastAction>
      ),
    });
  };

  const repeatYesterdayMeals = async () => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const yesterdayMeals = allMeals.filter((m) => m.date === yesterday);
    if (yesterdayMeals.length === 0) {
      toast({ title: 'No meals to repeat', description: 'Yesterday had no logged meals.' });
      return;
    }
    for (const meal of yesterdayMeals) {
      await appClient.entities.MealLog.create({
        date: today,
        mealType: meal.mealType,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['meals', today] });
    toast({ title: 'Meals repeated', description: `Copied ${yesterdayMeals.length} meal(s) from yesterday.` });
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-lg font-bold text-foreground">Meals</h1>

      {/* Macro Summary */}
      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Daily Macros</span>
          <span className="text-xs text-muted-foreground">{Math.round(calTarget - totalCals)} kcal remaining</span>
        </div>
        <MacroBar label="Calories" current={totalCals} target={calTarget} unit=" kcal" color="bg-gradient-to-r from-primary to-accent" />
        <MacroBar label="Protein" current={totalProtein} target={proTarget} color="bg-primary" />
        <MacroBar label="Carbs" current={totalCarbs} target={profile.carbTarget || 220} color="bg-accent" />
        <MacroBar label="Fat" current={totalFat} target={profile.fatTarget || 65} color="bg-chart-5" />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <GradientButton onClick={() => setShowForm(true)} className="flex-1 h-12 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Meal
        </GradientButton>
        <button onClick={repeatYesterdayMeals}
          className="h-12 px-3 rounded-xl bg-secondary text-foreground font-medium text-sm flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Repeat
        </button>
        <button onClick={() => setShowSaved(true)}
          className="h-12 px-4 rounded-xl bg-secondary text-foreground font-medium text-sm flex items-center gap-2">
          <Bookmark className="w-4 h-4" /> Saved
        </button>
      </div>

      {/* Meal List */}
      {mealsError ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-sm text-muted-foreground">Could not load meals.</p>
          <button onClick={() => { queryClient.invalidateQueries({ queryKey: ['meals', today] }); refetchAllMeals(); }} className="text-xs text-primary font-medium">Retry</button>
        </div>
      ) : mealsLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Loading meals...</div>
      ) : visibleMeals.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Today's Meals</div>
          <div className="max-h-96 overflow-y-auto pr-1 space-y-2">
          {pagedMeals.map(meal => (
            <div key={meal.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs text-primary font-medium">{MEAL_TYPE_LABELS[meal.mealType] || meal.mealType}</div>
                  <div className="text-sm font-semibold text-foreground mt-0.5">{meal.name}</div>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{meal.calories} kcal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fat}g</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditingMeal(meal)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => queueDeleteMeal(meal)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
          {visibleMeals.length > pagedMeals.length && (
            <button onClick={() => setMealVisibleCount((n) => n + 8)} className="w-full h-9 rounded-lg bg-secondary text-sm font-medium text-foreground">
              Load more meals
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No meals logged today.</p>
          <p className="text-xs text-muted-foreground mt-1">Tap Add Meal to get started.</p>
        </div>
      )}
    </div>
  );
}
