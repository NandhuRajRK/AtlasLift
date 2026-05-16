import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { Link, useNavigate } from 'react-router-dom';
import { getToday } from '@/lib/dateUtils';
import { format } from 'date-fns';
import { Dumbbell, UtensilsCrossed, Droplets, Scale, User, Plus } from 'lucide-react';
import ProgressRing from '@/components/ui/ProgressRing';
import MacroBar from '@/components/ui/MacroBar';
import TodayScoreCard from '@/components/today/TodayScoreCard';
import TodayWorkoutCard from '@/components/today/TodayWorkoutCard';
import TodayQuickActions from '@/components/today/TodayQuickActions';

export default function Today() {
  const today = getToday();

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => appClient.entities.UserProfile.list(),
    initialData: [],
  });
  const profile = profiles[0] || {};

  const { data: meals } = useQuery({
    queryKey: ['meals', today],
    queryFn: () => appClient.entities.MealLog.filter({ date: today }),
    initialData: [],
  });

  const { data: hydration } = useQuery({
    queryKey: ['hydration', today],
    queryFn: () => appClient.entities.HydrationEntry.filter({ date: today }),
    initialData: [],
  });

  const { data: workouts } = useQuery({
    queryKey: ['workouts', today],
    queryFn: () => appClient.entities.WorkoutSession.filter({ date: today }),
    initialData: [],
  });

  const { data: bodyMetrics } = useQuery({
    queryKey: ['bodyMetrics', today],
    queryFn: () => appClient.entities.BodyMetric.filter({ date: today }),
    initialData: [],
  });

  const totalCals = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fat || 0), 0);
  const totalWater = hydration.reduce((s, h) => s + (h.amountMl || 0), 0);
  const hasWorkout = workouts.some(w => w.status === 'completed');
  const hasWeight = bodyMetrics.length > 0;

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold tracking-widest text-primary uppercase">Atlas Lift</div>
          <h1 className="text-lg font-bold text-foreground mt-0.5">
            {format(new Date(), 'EEEE, MMM d')}
          </h1>
        </div>
        <Link to="/profile" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Daily Score */}
      <TodayScoreCard
        profile={profile}
        totalProtein={totalProtein}
        totalCals={totalCals}
        totalWater={totalWater}
        hasWorkout={hasWorkout}
        hasWeight={hasWeight}
      />

      {/* Workout Status */}
      <TodayWorkoutCard workouts={workouts} />

      {/* Nutrition */}
      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Nutrition</span>
          </div>
          <Link to="/meals" className="text-xs text-primary font-medium">View All</Link>
        </div>
        <MacroBar label="Calories" current={totalCals} target={profile.calorieTarget || 2200} unit=" kcal" color="bg-gradient-to-r from-primary to-accent" />
        <MacroBar label="Protein" current={totalProtein} target={profile.proteinTarget || 160} color="bg-primary" />
        <MacroBar label="Carbs" current={totalCarbs} target={profile.carbTarget || 220} color="bg-accent" />
        <MacroBar label="Fat" current={totalFat} target={profile.fatTarget || 65} color="bg-chart-5" />
      </div>

      {/* Hydration */}
      <Link to="/water" className="block bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-chart-3" />
            <span className="text-sm font-semibold text-foreground">Hydration</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {totalWater} / {profile.waterTargetMl || 3000} ml
          </span>
        </div>
        <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-chart-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((totalWater / (profile.waterTargetMl || 3000)) * 100, 100)}%` }} />
        </div>
      </Link>

      {/* Bodyweight */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-chart-4" />
            <span className="text-sm font-semibold text-foreground">Bodyweight</span>
          </div>
          {hasWeight ? (
            <span className="text-sm font-bold text-foreground">{bodyMetrics[0].bodyweightKg} kg</span>
          ) : (
            <span className="text-xs text-muted-foreground">Not logged</span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <TodayQuickActions />
    </div>
  );
}