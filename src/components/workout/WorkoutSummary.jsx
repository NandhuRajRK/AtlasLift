import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { CheckCircle2, Clock, Dumbbell, Weight, X } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

export default function WorkoutSummary({ session, onClose }) {
  const { data: sets } = useQuery({
    queryKey: ['workoutSets', session.id],
    queryFn: () => appClient.entities.WorkoutSet.filter({ workoutSessionId: session.id }),
    initialData: [],
  });

  const completedSets = sets.filter(s => s.isCompleted);
  const totalVolume = completedSets.reduce((s, set) => s + (set.weightKg || 0) * (set.reps || 0), 0);
  const exercises = [...new Set(completedSets.map(s => s.exerciseName))];

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Workout Complete</h1>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border text-center">
        <CheckCircle2 className="w-12 h-12 text-chart-4 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground">{session.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{session.date}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{session.durationMinutes || 0}</div>
          <div className="text-xs text-muted-foreground">Minutes</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <Dumbbell className="w-5 h-5 text-accent mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{completedSets.length}</div>
          <div className="text-xs text-muted-foreground">Sets</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <Weight className="w-5 h-5 text-chart-3 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{Math.round(totalVolume).toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Volume (kg)</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <CheckCircle2 className="w-5 h-5 text-chart-4 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{exercises.length}</div>
          <div className="text-xs text-muted-foreground">Exercises</div>
        </div>
      </div>

      {exercises.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Exercises</div>
          {exercises.map(name => {
            const exSets = completedSets.filter(s => s.exerciseName === name);
            const bestSet = exSets.reduce((best, s) => (s.weightKg || 0) * (s.reps || 0) > (best.weightKg || 0) * (best.reps || 0) ? s : best, exSets[0]);
            return (
              <div key={name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{name}</span>
                <span className="text-xs text-muted-foreground">{bestSet?.weightKg}kg × {bestSet?.reps}</span>
              </div>
            );
          })}
        </div>
      )}

      <GradientButton onClick={onClose} className="w-full h-12">Done</GradientButton>
    </div>
  );
}