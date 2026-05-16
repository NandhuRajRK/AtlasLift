import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2, Save, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import ExercisePicker from '@/components/workout/ExercisePicker';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ProgramEditor({ program, onClose }) {
  const queryClient = useQueryClient();
  const isNew = !program?.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: program?.name || '',
    goalType: program?.goalType || 'hypertrophy',
    daysPerWeek: program?.daysPerWeek || 4,
    description: program?.description || '',
  });
  const [days, setDays] = useState([]);
  const [exercises, setExercises] = useState({});
  const [pickingForDay, setPickingForDay] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const { data: existingDays } = useQuery({
    queryKey: ['programDays', program?.id],
    queryFn: () => program?.id ? appClient.entities.ProgramDay.filter({ programId: program.id }) : Promise.resolve([]),
    initialData: [],
    enabled: !!program?.id,
  });

  const { data: existingExercises } = useQuery({
    queryKey: ['programExercises'],
    queryFn: () => appClient.entities.ProgramExercise.list('order', 500),
    initialData: [],
  });

  useEffect(() => {
    if (existingDays.length > 0 && days.length === 0) {
      const sorted = [...existingDays].sort((a,b) => a.dayOrder - b.dayOrder);
      setDays(sorted);
      const exMap = {};
      sorted.forEach(d => {
        exMap[d.id] = existingExercises.filter(e => e.programDayId === d.id).sort((a,b) => a.order - b.order);
      });
      setExercises(exMap);
      setIsDirty(false);
    }
  }, [existingDays, existingExercises]);

  useEffect(() => {
    const beforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [isDirty]);

  const markDirty = () => setIsDirty(true);
  const requestClose = () => {
    if (!isDirty || window.confirm('You have unsaved changes. Discard them?')) {
      onClose();
    }
  };

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const normalizeDayOrder = (dayList) => dayList.map((d, idx) => ({ ...d, dayOrder: idx + 1 }));

  const addDay = () => {
    const newDay = { id: `new-${Date.now()}`, dayName: `Day ${days.length + 1}`, dayOrder: days.length + 1, focus: 'full_body' };
    setDays([...days, newDay]);
    setExercises({ ...exercises, [newDay.id]: [] });
    markDirty();
  };

  const removeDay = (dayId) => {
    setDays(normalizeDayOrder(days.filter(d => d.id !== dayId)));
    const newEx = { ...exercises };
    delete newEx[dayId];
    setExercises(newEx);
    markDirty();
  };

  const addExerciseToDay = (dayId, exercise) => {
    const dayExercises = exercises[dayId] || [];
    setExercises({
      ...exercises,
      [dayId]: [...dayExercises, {
        tmpId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        exerciseName: exercise.name,
        exerciseId: exercise.id,
        order: dayExercises.length + 1,
        targetSets: 3,
        targetReps: 10,
      }],
    });
    setPickingForDay(null);
    markDirty();
  };

  const removeExercise = (dayId, index) => {
    const dayExercises = exercises[dayId] || [];
    const next = dayExercises.filter((_, i) => i !== index).map((ex, idx) => ({ ...ex, order: idx + 1 }));
    setExercises({ ...exercises, [dayId]: next });
    markDirty();
  };

  const updateExerciseField = (dayId, index, field, value) => {
    const dayExercises = [...(exercises[dayId] || [])];
    dayExercises[index] = { ...dayExercises[index], [field]: value };
    setExercises({ ...exercises, [dayId]: dayExercises });
    markDirty();
  };

  const onDragEnd = (result) => {
    const { destination, source, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'DAY') {
      const reordered = normalizeDayOrder(reorder(days, source.index, destination.index));
      setDays(reordered);
      markDirty();
      return;
    }

    const sourceDayId = source.droppableId.replace('ex-', '');
    const destinationDayId = destination.droppableId.replace('ex-', '');
    const sourceExercises = [...(exercises[sourceDayId] || [])];
    const [moved] = sourceExercises.splice(source.index, 1);

    if (sourceDayId === destinationDayId) {
      sourceExercises.splice(destination.index, 0, moved);
      const normalized = sourceExercises.map((ex, idx) => ({ ...ex, order: idx + 1 }));
      setExercises({ ...exercises, [sourceDayId]: normalized });
    } else {
      const destinationExercises = [...(exercises[destinationDayId] || [])];
      destinationExercises.splice(destination.index, 0, moved);
      setExercises({
        ...exercises,
        [sourceDayId]: sourceExercises.map((ex, idx) => ({ ...ex, order: idx + 1 })),
        [destinationDayId]: destinationExercises.map((ex, idx) => ({ ...ex, order: idx + 1 })),
      });
    }
    markDirty();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let programId = program?.id;
      if (isNew) {
        const created = await appClient.entities.WorkoutProgram.create({ ...form, isActive: false });
        programId = created.id;
      } else {
        await appClient.entities.WorkoutProgram.update(programId, form);
      }

      // Remove deleted days (and their exercises) from persistence.
      const persistedDayIds = new Set(days.filter((d) => !d.id.startsWith('new-')).map((d) => d.id));
      const deletedDays = existingDays.filter((d) => !persistedDayIds.has(d.id));
      for (const deletedDay of deletedDays) {
        const linkedExercises = existingExercises.filter((e) => e.programDayId === deletedDay.id);
        for (const ex of linkedExercises) {
          await appClient.entities.ProgramExercise.delete(ex.id);
        }
        await appClient.entities.ProgramDay.delete(deletedDay.id);
      }

      // Upsert days and fully reconcile exercises per day.
      for (let index = 0; index < days.length; index++) {
        const day = days[index];
        let dayId = day.id;
        const dayPayload = {
          programId,
          dayName: day.dayName,
          dayOrder: index + 1,
          focus: day.focus,
        };

        if (day.id.startsWith('new-')) {
          const created = await appClient.entities.ProgramDay.create(dayPayload);
          dayId = created.id;
        } else {
          await appClient.entities.ProgramDay.update(dayId, dayPayload);
        }

        // Replace exercises for this day so edits/deletions stay in sync.
        const persistedExercises = existingExercises.filter((e) => e.programDayId === dayId);
        for (const ex of persistedExercises) {
          await appClient.entities.ProgramExercise.delete(ex.id);
        }

        const dayExercises = exercises[day.id] || [];
        for (let exIdx = 0; exIdx < dayExercises.length; exIdx++) {
          const ex = dayExercises[exIdx];
          await appClient.entities.ProgramExercise.create({
            programDayId: dayId,
            exerciseName: ex.exerciseName,
            exerciseId: ex.exerciseId,
            order: exIdx + 1,
            targetSets: Number(ex.targetSets) || 3,
            targetReps: Number(ex.targetReps) || 10,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programDays'] });
      queryClient.invalidateQueries({ queryKey: ['programExercises'] });
      setIsDirty(false);
      onClose();
    } catch (error) {
      console.error('Failed to save program:', error);
    } finally {
      setSaving(false);
    }
  };

  if (pickingForDay) {
    return <ExercisePicker onSelect={(ex) => addExerciseToDay(pickingForDay, ex)} onClose={() => setPickingForDay(null)} />;
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{isNew ? 'New Program' : 'Edit Program'}</h2>
        <button onClick={requestClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      {isDirty && <p className="text-xs text-amber-500">You have unsaved changes.</p>}

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Program Name</Label>
          <Input value={form.name} onChange={e => { setForm({...form, name: e.target.value}); markDirty(); }} placeholder="e.g. Upper Lower Split" className="bg-secondary border-0 text-foreground mt-1 h-11" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Goal</Label>
            <Select value={form.goalType} onValueChange={v => { setForm({...form, goalType: v}); markDirty(); }}>
              <SelectTrigger className="bg-secondary border-0 text-foreground mt-1 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['hypertrophy','strength','recomp','general_fitness','cut','lean_bulk'].map(g => <SelectItem key={g} value={g}>{g.replace('_',' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Days/Week</Label>
            <Input type="number" value={form.daysPerWeek} onChange={e => { setForm({...form, daysPerWeek: Number(e.target.value)}); markDirty(); }} className="bg-secondary border-0 text-foreground mt-1 h-11" />
          </div>
        </div>
      </div>

      {/* Training Days */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Training Days</span>
          <button onClick={addDay} className="text-xs text-primary font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add Day</button>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="days" type="DAY">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                {days.map((day, idx) => (
                  <Draggable key={day.id} draggableId={String(day.id)} index={idx}>
                    {(dragProvided) => (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className="bg-card rounded-xl p-4 border border-border space-y-3">
                        <div className="flex items-center gap-2">
                          <button {...dragProvided.dragHandleProps} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <GripVertical className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <Input value={day.dayName} onChange={e => {
                            const updated = [...days]; updated[idx] = {...day, dayName: e.target.value}; setDays(updated); markDirty();
                          }} className="bg-secondary border-0 text-foreground h-9 flex-1 text-sm" />
                          <Select value={day.focus || 'full_body'} onValueChange={v => {
                            const updated = [...days]; updated[idx] = {...day, focus: v}; setDays(updated); markDirty();
                          }}>
                            <SelectTrigger className="bg-secondary border-0 text-foreground h-9 w-24 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['push','pull','legs','upper','lower','full_body','arms','shoulders'].map(f => <SelectItem key={f} value={f}>{f.replace('_',' ')}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <button onClick={() => removeDay(day.id)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>

                        <Droppable droppableId={`ex-${day.id}`} type="EXERCISE">
                          {(exerciseDropProvided) => (
                            <div ref={exerciseDropProvided.innerRef} {...exerciseDropProvided.droppableProps} className="space-y-2">
                              {(exercises[day.id] || []).map((ex, i) => (
                                <Draggable key={String(ex.id || ex.tmpId || `${day.id}-${i}`)} draggableId={String(ex.id || ex.tmpId || `${day.id}-${i}`)} index={i}>
                                  {(exerciseDragProvided) => (
                                    <div ref={exerciseDragProvided.innerRef} {...exerciseDragProvided.draggableProps} className="px-2 py-2 bg-secondary rounded-lg space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <button {...exerciseDragProvided.dragHandleProps} className="w-6 h-6 rounded bg-card flex items-center justify-center shrink-0">
                                            <GripVertical className="w-3 h-3 text-muted-foreground" />
                                          </button>
                                          <span className="text-xs text-foreground truncate">{ex.exerciseName}</span>
                                        </div>
                                        <button onClick={() => removeExercise(day.id, i)} className="w-6 h-6 rounded bg-card flex items-center justify-center shrink-0">
                                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                          <Label className="text-[10px] text-muted-foreground">Sets</Label>
                                          <Input type="number" min="1" max="20" value={ex.targetSets} onChange={(e) => updateExerciseField(day.id, i, 'targetSets', Number(e.target.value))} className="h-8 bg-card border-0 text-foreground text-xs mt-1" />
                                        </div>
                                        <div className="flex-1">
                                          <Label className="text-[10px] text-muted-foreground">Reps</Label>
                                          <Input type="number" min="1" max="100" value={ex.targetReps} onChange={(e) => updateExerciseField(day.id, i, 'targetReps', Number(e.target.value))} className="h-8 bg-card border-0 text-foreground text-xs mt-1" />
                                        </div>
                                        <div className="flex flex-col gap-1 pt-4">
                                          <button onClick={() => {
                                            if (i === 0) return;
                                            const list = [...(exercises[day.id] || [])];
                                            [list[i - 1], list[i]] = [list[i], list[i - 1]];
                                            setExercises({ ...exercises, [day.id]: list.map((item, idx2) => ({ ...item, order: idx2 + 1 })) });
                                            markDirty();
                                          }} className="w-6 h-4 rounded bg-card flex items-center justify-center">
                                            <ArrowUp className="w-3 h-3 text-muted-foreground" />
                                          </button>
                                          <button onClick={() => {
                                            const list = [...(exercises[day.id] || [])];
                                            if (i >= list.length - 1) return;
                                            [list[i], list[i + 1]] = [list[i + 1], list[i]];
                                            setExercises({ ...exercises, [day.id]: list.map((item, idx2) => ({ ...item, order: idx2 + 1 })) });
                                            markDirty();
                                          }} className="w-6 h-4 rounded bg-card flex items-center justify-center">
                                            <ArrowDown className="w-3 h-3 text-muted-foreground" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {exerciseDropProvided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <button onClick={() => setPickingForDay(day.id)}
                          className="w-full h-8 text-xs text-primary font-medium flex items-center justify-center gap-1 border border-dashed border-border rounded-lg">
                          <Plus className="w-3 h-3" /> Add Exercise
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <GradientButton onClick={handleSave} disabled={!form.name || saving} className="w-full h-12 flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Program'}
      </GradientButton>
    </div>
  );
}
