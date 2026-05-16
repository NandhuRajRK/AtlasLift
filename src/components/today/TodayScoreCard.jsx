import React from 'react';
import ProgressRing from '@/components/ui/ProgressRing';

export default function TodayScoreCard({ profile, totalProtein, totalCals, totalWater, hasWorkout, hasWeight }) {
  const proteinTarget = profile.proteinTarget || 160;
  const calTarget = profile.calorieTarget || 2200;
  const waterTarget = profile.waterTargetMl || 3000;

  const proteinScore = Math.min((totalProtein / proteinTarget) * 100, 100);
  const calScore = calTarget > 0 ? Math.max(0, 100 - Math.abs((totalCals - calTarget) / calTarget) * 100) : 0;
  const waterScore = Math.min((totalWater / waterTarget) * 100, 100);
  const workoutScore = hasWorkout ? 100 : 0;

  const overall = Math.round((proteinScore * 0.3 + calScore * 0.3 + waterScore * 0.2 + workoutScore * 0.2));

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center gap-5">
        <ProgressRing progress={overall} size={72} strokeWidth={5}>
          <span className="text-lg font-bold text-foreground">{overall}</span>
        </ProgressRing>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">Daily Score</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {overall >= 80 ? 'Great day! Keep it up.' :
             overall >= 50 ? 'Good progress. Stay on track.' :
             'Get started on today\'s targets.'}
          </p>
          <div className="flex gap-3 mt-2">
            <div className={`w-2 h-2 rounded-full ${hasWorkout ? 'bg-primary' : 'bg-secondary'}`} />
            <div className={`w-2 h-2 rounded-full ${proteinScore >= 80 ? 'bg-primary' : 'bg-secondary'}`} />
            <div className={`w-2 h-2 rounded-full ${waterScore >= 80 ? 'bg-chart-3' : 'bg-secondary'}`} />
            <div className={`w-2 h-2 rounded-full ${hasWeight ? 'bg-chart-4' : 'bg-secondary'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}