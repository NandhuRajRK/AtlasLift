import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { getDateRange } from '@/lib/dateUtils';
import { Dumbbell, UtensilsCrossed, Droplets } from 'lucide-react';

export default function AdherenceCards({ profile }) {
  const last7 = getDateRange(7);

  const { data: workouts } = useQuery({
    queryKey: ['allWorkouts'],
    queryFn: () => appClient.entities.WorkoutSession.list('-date', 30),
    initialData: [],
  });

  const { data: meals } = useQuery({
    queryKey: ['allMeals'],
    queryFn: () => appClient.entities.MealLog.list('-date', 100),
    initialData: [],
  });

  const { data: hydration } = useQuery({
    queryKey: ['allHydration'],
    queryFn: () => appClient.entities.HydrationEntry.list('-date', 100),
    initialData: [],
  });

  const proteinTarget = profile.proteinTarget || 160;
  const waterTarget = profile.waterTargetMl || 3000;

  // Workout adherence: days with completed workout in last 7
  const workoutDays = last7.filter(d => workouts.some(w => w.date === d && w.status === 'completed')).length;

  // Protein adherence: days meeting ≥80% protein target
  const proteinDays = last7.filter(d => {
    const dayProtein = meals.filter(m => m.date === d).reduce((s, m) => s + (m.protein || 0), 0);
    return dayProtein >= proteinTarget * 0.8;
  }).length;

  // Hydration adherence
  const waterDays = last7.filter(d => {
    const dayWater = hydration.filter(h => h.date === d).reduce((s, h) => s + (h.amountMl || 0), 0);
    return dayWater >= waterTarget * 0.8;
  }).length;

  const cards = [
    { icon: Dumbbell, label: 'Workouts', value: `${workoutDays}/7`, color: 'text-primary' },
    { icon: UtensilsCrossed, label: 'Protein Target', value: `${proteinDays}/7`, color: 'text-accent' },
    { icon: Droplets, label: 'Hydration', value: `${waterDays}/7`, color: 'text-chart-3' },
  ];

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">7-Day Adherence</div>
      <div className="grid grid-cols-3 gap-3">
        {cards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <div className="text-lg font-bold text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}