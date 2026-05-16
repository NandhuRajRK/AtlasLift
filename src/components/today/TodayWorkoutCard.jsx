import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export default function TodayWorkoutCard({ workouts }) {
  const completedWorkout = workouts.find(w => w.status === 'completed');
  const inProgressWorkout = workouts.find(w => w.status === 'in_progress');
  const plannedWorkout = workouts.find(w => w.status === 'planned');

  const activeWorkout = inProgressWorkout || completedWorkout || plannedWorkout;

  return (
    <Link to="/workout" className="block bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Workout</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </div>
      {activeWorkout ? (
        <div className="mt-3 flex items-center gap-2">
          {completedWorkout ? (
            <CheckCircle2 className="w-4 h-4 text-chart-4" />
          ) : (
            <Clock className="w-4 h-4 text-accent" />
          )}
          <span className="text-sm text-foreground">{activeWorkout.name}</span>
          <span className={`text-xs ml-auto font-medium ${
            completedWorkout ? 'text-chart-4' : inProgressWorkout ? 'text-accent' : 'text-muted-foreground'
          }`}>
            {completedWorkout ? 'Completed' : inProgressWorkout ? 'In Progress' : 'Planned'}
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-2">No workout planned. Tap to start one.</p>
      )}
    </Link>
  );
}