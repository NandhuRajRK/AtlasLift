import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Check, Trash2, Clock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import ExercisePicker from './ExercisePicker';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';

export default function WorkoutLogger({ sessionId, onFinish }) {
  const queryClient = useQueryClient();
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [restPreset, setRestPreset] = useState(90);
  const [pendingDeleteSetIds, setPendingDeleteSetIds] = useState([]);
  const [deleteTimers, setDeleteTimers] = useState({});

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const sessions = await appClient.entities.WorkoutSession.list();
      return sessions.find(s => s.id === sessionId);
    },
  });

  const { data: sets, refetch: refetchSets } = useQuery({
    queryKey: ['workoutSets', sessionId],
    queryFn: () => appClient.entities.WorkoutSet.filter({ workoutSessionId: sessionId }),
    initialData: [],
  });

  const { data: programExercises } = useQuery({
    queryKey: ['programExercises', session?.programDayId],
    queryFn: () => session?.programDayId ? appClient.entities.ProgramExercise.filter({ programDayId: session.programDayId }) : Promise.resolve([]),
    initialData: [],
    enabled: !!session?.programDayId,
  });

  // Auto-populate sets from program
  useEffect(() => {
    if (programExercises.length > 0 && sets.length === 0 && session) {
      const sorted = [...programExercises].sort((a,b) => a.order - b.order);
      const newSets = [];
      sorted.forEach(pe => {
        for (let i = 1; i <= (pe.targetSets || 3); i++) {
          newSets.push({
            workoutSessionId: sessionId,
            exerciseName: pe.exerciseName,
            exerciseId: pe.exerciseId,
            setNumber: i,
            weightKg: 0,
            reps: pe.targetReps || 0,
            rpe: pe.targetRPE || 0,
            supersetTag: pe.supersetTag || '',
            isWarmup: false,
            isCompleted: false,
          });
        }
      });
      if (newSets.length > 0) {
        appClient.entities.WorkoutSet.bulkCreate(newSets).then(() => refetchSets());
      }
    }
  }, [programExercises, sets.length, session]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (restSecondsLeft <= 0) return;
    const t = setInterval(() => setRestSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [restSecondsLeft]);

  const addSet = useMutation({
    mutationFn: (data) => appClient.entities.WorkoutSet.create(data),
    onSuccess: () => refetchSets(),
  });

  const updateSet = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.WorkoutSet.update(id, data),
    onSuccess: () => refetchSets(),
  });

  const deleteSet = useMutation({
    mutationFn: (id) => appClient.entities.WorkoutSet.delete(id),
    onSuccess: () => refetchSets(),
  });
  const { data: programDays } = useQuery({
    queryKey: ['programDaysForLogger'],
    queryFn: () => appClient.entities.ProgramDay.list(),
    initialData: [],
  });

  const queueDeleteSet = (set) => {
    if (pendingDeleteSetIds.includes(set.id)) return;
    setPendingDeleteSetIds((prev) => [...prev, set.id]);
    const timer = setTimeout(async () => {
      await deleteSet.mutateAsync(set.id);
      setPendingDeleteSetIds((prev) => prev.filter((id) => id !== set.id));
      setDeleteTimers((prev) => {
        const next = { ...prev };
        delete next[set.id];
        return next;
      });
    }, 5000);
    setDeleteTimers((prev) => ({ ...prev, [set.id]: timer }));
    toast({
      title: 'Set removed',
      description: `${set.exerciseName} set ${set.setNumber} will be deleted.`,
      action: (
        <ToastAction onClick={() => {
          clearTimeout(timer);
          setPendingDeleteSetIds((prev) => prev.filter((id) => id !== set.id));
          setDeleteTimers((prev) => {
            const next = { ...prev };
            delete next[set.id];
            return next;
          });
        }}>
          Undo
        </ToastAction>
      ),
    });
  };

  const finishWorkout = async () => {
    const dur = Math.round(elapsed / 60);
    await appClient.entities.WorkoutSession.update(sessionId, {
      status: 'completed',
      endTime: new Date().toISOString(),
      durationMinutes: dur,
    });
    onFinish({ ...session, durationMinutes: dur, status: 'completed' });
  };

  const handleAddExercise = async (exercise) => {
    const exerciseSets = sets.filter(s => s.exerciseName === exercise.name);
    const startSet = exerciseSets.length + 1;
    const newSets = [1, 2, 3].map((_, i) => ({
      workoutSessionId: sessionId,
      exerciseName: exercise.name,
      exerciseId: exercise.id,
      setNumber: startSet + i,
      weightKg: 0,
      reps: 0,
      isWarmup: false,
      isCompleted: false,
    }));
    await appClient.entities.WorkoutSet.bulkCreate(newSets);
    refetchSets();
    setShowExercisePicker(false);
    setExpandedExercise(exercise.name);
  };

  // Group sets by exercise
  const exerciseGroups = {};
  sets.filter((s) => !pendingDeleteSetIds.includes(s.id)).forEach(s => {
    if (!exerciseGroups[s.exerciseName]) exerciseGroups[s.exerciseName] = [];
    exerciseGroups[s.exerciseName].push(s);
  });

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const displaySessionName = programDays.find((d) => d.id === session?.programDayId)?.dayName || session?.name || 'Workout';

  if (showExercisePicker) {
    return <ExercisePicker onSelect={handleAddExercise} onClose={() => setShowExercisePicker(false)} />;
  }

  return (
    <div className="px-4 pt-6 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">{displaySessionName}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-mono font-medium">{formatTime(elapsed)}</span>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rest Timer</span>
          <span className="text-sm font-bold text-foreground">{formatTime(restSecondsLeft)}</span>
        </div>
        <div className="flex gap-2">
          {[60, 90, 120].map((preset) => (
            <button
              key={preset}
              onClick={() => { setRestPreset(preset); setRestSecondsLeft(preset); }}
              className={`h-8 px-3 rounded-lg text-xs font-medium ${restPreset === preset ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'}`}
            >
              {preset}s
            </button>
          ))}
          <button
            onClick={() => setRestSecondsLeft(0)}
            className="h-8 px-3 rounded-lg text-xs font-medium bg-secondary text-muted-foreground border border-border"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Exercise Cards */}
      {Object.entries(exerciseGroups).map(([name, exSets]) => {
        const isExpanded = expandedExercise === name || expandedExercise === null;
        const supersetTag = exSets[0]?.supersetTag || '';
        return (
          <div key={name} className="bg-card rounded-2xl border border-border overflow-hidden">
            <button onClick={() => setExpandedExercise(isExpanded && expandedExercise !== null ? null : name)}
              className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{name}</span>
                {supersetTag ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                    Group {supersetTag}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{exSets.filter(s => s.isCompleted).length}/{exSets.length}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
            {isExpanded && (
              <div className="px-4 pb-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-1 text-[10px] text-muted-foreground font-medium mb-2 px-1">
                  <div className="col-span-2">SET</div>
                  <div className="col-span-3">KG</div>
                  <div className="col-span-3">REPS</div>
                  <div className="col-span-2">RPE</div>
                  <div className="col-span-2"></div>
                </div>
                {exSets.sort((a,b) => a.setNumber - b.setNumber).map(set => (
                  <div key={set.id} className={`grid grid-cols-12 gap-1 items-center mb-1.5 ${set.isCompleted ? 'opacity-60' : ''}`}>
                    <div className="col-span-2 text-xs text-muted-foreground font-medium pl-1">
                      {set.isWarmup ? 'W' : set.setNumber}
                    </div>
                    <div className="col-span-3">
                      <Input type="number" value={set.weightKg || ''} placeholder="0"
                        onChange={e => updateSet.mutate({ id: set.id, data: { weightKg: Number(e.target.value) } })}
                        className="h-9 bg-secondary border-0 text-center text-sm text-foreground px-1" />
                    </div>
                    <div className="col-span-3">
                      <Input type="number" value={set.reps || ''} placeholder="0"
                        onChange={e => updateSet.mutate({ id: set.id, data: { reps: Number(e.target.value) } })}
                        className="h-9 bg-secondary border-0 text-center text-sm text-foreground px-1" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" value={set.rpe || ''} placeholder="-"
                        onChange={e => updateSet.mutate({ id: set.id, data: { rpe: Number(e.target.value) } })}
                        className="h-9 bg-secondary border-0 text-center text-sm text-foreground px-1" />
                    </div>
                    <div className="col-span-2 flex gap-0.5 justify-end">
                      <button onClick={() => {
                        const toggled = !set.isCompleted;
                        updateSet.mutate({ id: set.id, data: { isCompleted: toggled } });
                        if (toggled) setRestSecondsLeft(restPreset);
                      }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          set.isCompleted ? 'bg-chart-4/20 text-chart-4' : 'bg-secondary text-muted-foreground'
                        }`}>
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => queueDeleteSet(set)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary text-muted-foreground">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => addSet.mutate({
                  workoutSessionId: sessionId,
                  exerciseName: name,
                  exerciseId: exSets[0]?.exerciseId,
                  setNumber: exSets.length + 1,
                  weightKg: exSets[exSets.length - 1]?.weightKg || 0,
                  reps: exSets[exSets.length - 1]?.reps || 0,
                  isWarmup: false,
                  isCompleted: false,
                })} className="w-full h-8 mt-1 text-xs text-primary font-medium flex items-center justify-center gap-1 bg-primary/5 rounded-lg">
                  <Plus className="w-3 h-3" /> Add Set
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Exercise */}
      <button onClick={() => setShowExercisePicker(true)}
        className="w-full h-12 rounded-xl border border-dashed border-border text-sm text-muted-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
        <Plus className="w-4 h-4" /> Add Exercise
      </button>

      {/* Sticky Finish Button */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4">
        <GradientButton onClick={finishWorkout} className="w-full h-14 flex items-center justify-center gap-2 text-base shadow-lg">
          <CheckCircle2 className="w-5 h-5" /> Finish Workout
        </GradientButton>
      </div>
    </div>
  );
}
