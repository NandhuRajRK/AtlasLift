import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { getToday } from '@/lib/dateUtils';
import { Dumbbell, Plus, Play, CheckCircle2, Clock, ChevronRight, Trash2 } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import WorkoutLogger from '@/components/workout/WorkoutLogger';
import WorkoutSummary from '@/components/workout/WorkoutSummary';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { subDays, parseISO } from 'date-fns';
import { buildProgramDayMap, calculateWeeklyLoadChange, resolveSessionDisplayName } from '@/lib/workoutDomain';

export default function Workout() {
  const today = getToday();
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showSummary, setShowSummary] = useState(null);
  const [pendingDeleteSessionIds, setPendingDeleteSessionIds] = useState([]);
  const [deleteTimers, setDeleteTimers] = useState({});
  const [activeDaysVisibleCount, setActiveDaysVisibleCount] = useState(6);
  const [recentVisibleCount, setRecentVisibleCount] = useState(6);

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

  const { data: allSets } = useQuery({
    queryKey: ['allWorkoutSetsForGuidance'],
    queryFn: () => appClient.entities.WorkoutSet.list('-created_date', 3000),
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
  const todaySessions = sessions.filter(s => s.date === today && !pendingDeleteSessionIds.includes(s.id));
  const recentSessions = sessions.filter(s => s.date !== today && s.status === 'completed' && !pendingDeleteSessionIds.includes(s.id));
  const activeDays = activeProgram ? programDays.filter(d => d.programId === activeProgram.id).sort((a,b) => a.dayOrder - b.dayOrder) : [];
  const visibleActiveDays = activeDays.slice(0, activeDaysVisibleCount);
  const visibleRecentSessions = recentSessions.slice(0, recentVisibleCount);
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const programDayById = buildProgramDayMap(programDays);

  const currentWeekStart = subDays(new Date(), 6);
  const prevWeekStart = subDays(new Date(), 13);
  const prevWeekEnd = subDays(new Date(), 7);
  const { currentWeekLoad, previousWeekLoad, loadChangePct } = calculateWeeklyLoadChange({
    allSets,
    sessionById,
    currentWeekStart,
    prevWeekStart,
    prevWeekEnd,
  });
  const weekCompleted = sessions.filter((s) => s.status === 'completed' && s.date && parseISO(s.date) >= currentWeekStart).length;
  const goSlowerWarning = loadChangePct > 15 && weekCompleted >= 4;
  const deloadSuggestion = loadChangePct < 5 && weekCompleted >= 4;

  const deleteSession = useMutation({
    mutationFn: async (sessionId) => {
      const sessionSets = await appClient.entities.WorkoutSet.filter({ workoutSessionId: sessionId });
      for (const st of sessionSets) await appClient.entities.WorkoutSet.delete(st.id);
      await appClient.entities.WorkoutSession.delete(sessionId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workoutSessions'] }),
  });

  const queueDeleteSession = (session) => {
    if (pendingDeleteSessionIds.includes(session.id)) return;
    setPendingDeleteSessionIds((prev) => [...prev, session.id]);
    const timer = setTimeout(async () => {
      await deleteSession.mutateAsync(session.id);
      setPendingDeleteSessionIds((prev) => prev.filter((id) => id !== session.id));
      setDeleteTimers((prev) => {
        const next = { ...prev };
        delete next[session.id];
        return next;
      });
    }, 5000);
    setDeleteTimers((prev) => ({ ...prev, [session.id]: timer }));
    toast({
      title: 'Workout removed',
      description: `${session.name} will be deleted.`,
      action: (
        <ToastAction onClick={() => {
          clearTimeout(timer);
          setPendingDeleteSessionIds((prev) => prev.filter((id) => id !== session.id));
          setDeleteTimers((prev) => {
            const next = { ...prev };
            delete next[session.id];
            return next;
          });
        }}>
          Undo
        </ToastAction>
      ),
    });
  };

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
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
            {visibleActiveDays.map(day => (
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
          {activeDays.length > visibleActiveDays.length && (
            <button onClick={() => setActiveDaysVisibleCount((n) => n + 6)} className="w-full h-9 rounded-lg bg-secondary text-sm font-medium text-foreground mt-2">
              Load more days
            </button>
          )}
        </div>
      )}

      {/* Quick Start */}
      <GradientButton onClick={() => startWorkout.mutate(null)} className="w-full h-14 flex items-center justify-center gap-2" disabled={startWorkout.isPending}>
        <Plus className="w-5 h-5" />
        <span>{startWorkout.isPending ? 'Starting...' : 'Quick Workout'}</span>
      </GradientButton>

      <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Progression & Deload Guidance</div>
        <div className="text-sm text-foreground">
          {goSlowerWarning
            ? 'Load is up sharply this week. Go slower on progression to manage fatigue and technique quality.'
            : deloadSuggestion
              ? 'Load change is low with high recent frequency. Consider a deload: reduce load/volume by 30-40% for 4-7 days.'
              : 'Current loading trend looks stable. Continue current progression pace.'}
        </div>
        <div className="text-xs text-muted-foreground">
          Week load: {Math.round(currentWeekLoad)} kg · Previous week: {Math.round(previousWeekLoad)} kg
          {previousWeekLoad > 0 ? ` · ${loadChangePct >= 0 ? '+' : ''}${Math.round(loadChangePct)}%` : ''}
        </div>
      </div>

      {/* Today's sessions */}
      {todaySessions.filter(s => s.status === 'completed').length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Today</div>
          {todaySessions.filter(s => s.status === 'completed').map(s => (
            <div key={s.id} className="w-full flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-chart-4" />
                <button onClick={() => setShowSummary(s)} className="text-sm text-foreground">{resolveSessionDisplayName(s, programDayById)}</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{s.durationMinutes ? `${s.durationMinutes} min` : ''}</span>
                <button onClick={() => queueDeleteSession(s)} className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent History */}
      {recentSessions.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Recent</div>
          <div className="max-h-80 overflow-y-auto pr-1">
          {visibleRecentSessions.map(s => (
            <div key={s.id} className="w-full flex items-center justify-between py-2">
              <div>
                <button onClick={() => setShowSummary(s)} className="text-sm text-foreground text-left">{resolveSessionDisplayName(s, programDayById)}</button>
                <div className="text-xs text-muted-foreground">{s.date}</div>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <button onClick={() => queueDeleteSession(s)} className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
          </div>
          {recentSessions.length > visibleRecentSessions.length && (
            <button onClick={() => setRecentVisibleCount((n) => n + 6)} className="w-full h-9 rounded-lg bg-secondary text-sm font-medium text-foreground mt-2">
              Load more history
            </button>
          )}
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
