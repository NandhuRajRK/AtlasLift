import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { getToday } from '@/lib/dateUtils';
import { Dumbbell, Plus, Play, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import WorkoutLogger from '@/components/workout/WorkoutLogger';
import WorkoutSummary from '@/components/workout/WorkoutSummary';
import { Link } from 'react-router-dom';

export default function Workout() {
  const today = getToday();
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showSummary, setShowSummary] = useState(null);

  const { data: sessions } = useQuery({
    queryKey: ['workoutSessions'],
    queryFn: () => appClient.entities.WorkoutSession.list('-date', 20),
    initialData: [],
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: () => appClient.entities.WorkoutProgram.list(),
    initialData: [],
  });

  const { data: programDays } = useQuery({
    queryKey: ['programDays'],
    queryFn: () => appClient.entities.ProgramDay.list(),
    initialData: [],
  });

  const activeProgram = programs.find(p => p.isActive);

  const startWorkout = useMutation({
    mutationFn: async (dayInfo) => {
      const session = await appClient.entities.WorkoutSession.create({
        name: dayInfo?.dayName || 'Quick Workout',
        date: today,
        startTime: new Date().toISOString(),
        status: 'in_progress',
        programId: dayInfo?.programId,
        programDayId: dayInfo?.id,
      });
      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['workoutSessions'] });
      setActiveSessionId(session.id);
    },
  });

  const inProgressSession = sessions.find(s => s.status === 'in_progress');
  const todaySessions = sessions.filter(s => s.date === today);
  const recentSessions = sessions.filter(s => s.date !== today && s.status === 'completed').slice(0, 5);
  const activeDays = activeProgram ? programDays.filter(d => d.programId === activeProgram.id).sort((a,b) => a.dayOrder - b.dayOrder) : [];

  if (activeSessionId || inProgressSession) {
    return <WorkoutLogger sessionId={activeSessionId || inProgressSession.id} onFinish={(session) => {
      setActiveSessionId(null);
      setShowSummary(session);
      queryClient.invalidateQueries({ queryKey: ['workoutSessions'] });
    }} />;
  }

  if (showSummary) {
    return <WorkoutSummary session={showSummary} onClose={() => setShowSummary(null)} />;
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Workout</h1>
        <Link to="/programs" className="text-xs text-primary font-medium">Programs</Link>
      </div>

      {/* Active Program */}
      {activeProgram && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Active Program</div>
          <div className="text-sm font-bold text-foreground">{activeProgram.name}</div>
          <div className="mt-3 space-y-2">
            {activeDays.map(day => (
              <button key={day.id} onClick={() => startWorkout.mutate(day)}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-xl active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">{day.dayName}</div>
                    <div className="text-xs text-muted-foreground capitalize">{day.focus}</div>
                  </div>
                </div>
                <Play className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Start */}
      <GradientButton onClick={() => startWorkout.mutate(null)} className="w-full h-14 flex items-center justify-center gap-2" disabled={startWorkout.isPending}>
        <Plus className="w-5 h-5" />
        <span>{startWorkout.isPending ? 'Starting...' : 'Quick Workout'}</span>
      </GradientButton>

      {/* Today's sessions */}
      {todaySessions.filter(s => s.status === 'completed').length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Today</div>
          {todaySessions.filter(s => s.status === 'completed').map(s => (
            <button key={s.id} onClick={() => setShowSummary(s)} className="w-full flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-chart-4" />
                <span className="text-sm text-foreground">{s.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{s.durationMinutes ? `${s.durationMinutes} min` : ''}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recent History */}
      {recentSessions.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Recent</div>
          {recentSessions.map(s => (
            <button key={s.id} onClick={() => setShowSummary(s)} className="w-full flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-foreground text-left">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.date}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {!activeProgram && sessions.length === 0 && (
        <div className="text-center py-8">
          <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No workouts yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Start a quick workout or set up a program.</p>
        </div>
      )}
    </div>
  );
}