import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2, Save } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import ExercisePicker from '@/components/workout/ExercisePicker';

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
    }
  }, [existingDays, existingExercises]);

  const addDay = () => {
    const newDay = { id: `new-${Date.now()}`, dayName: `Day ${days.length + 1}`, dayOrder: days.length + 1, focus: 'full_body' };
    setDays([...days, newDay]);
    setExercises({ ...exercises, [newDay.id]: [] });
  };

  const removeDay = (dayId) => {
    setDays(days.filter(d => d.id !== dayId));
    const newEx = { ...exercises };
    delete newEx[dayId];
    setExercises(newEx);
  };

  const addExerciseToDay = (dayId, exercise) => {
    const dayExercises = exercises[dayId] || [];
    setExercises({
      ...exercises,
      [dayId]: [...dayExercises, {
        exerciseName: exercise.name,
        exerciseId: exercise.id,
        order: dayExercises.length + 1,
        targetSets: 3,
        targetReps: 10,
      }],
    });
    setPickingForDay(null);
  };

  const handleSave = async () => {
    setSaving(true);
    let programId = program?.id;
    if (isNew) {
      const created = await appClient.entities.WorkoutProgram.create({ ...form, isActive: false });
      programId = created.id;
    } else {
      await appClient.entities.WorkoutProgram.update(programId, form);
    }

    // Save days and exercises
    for (const day of days) {
      let dayId = day.id;
      if (day.id.startsWith('new-')) {
        const created = await appClient.entities.ProgramDay.create({
          programId,
          dayName: day.dayName,
          dayOrder: day.dayOrder,
          focus: day.focus,
        });
        dayId = created.id;
      } else {
        await appClient.entities.ProgramDay.update(dayId, { dayName: day.dayName, dayOrder: day.dayOrder, focus: day.focus });
      }

      // Create exercises for new days
      const dayExercises = exercises[day.id] || [];
      for (const ex of dayExercises) {
        if (!ex.id) {
          await appClient.entities.ProgramExercise.create({
            programDayId: dayId,
            exerciseName: ex.exerciseName,
            exerciseId: ex.exerciseId,
            order: ex.order,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
          });
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['programs'] });
    queryClient.invalidateQueries({ queryKey: ['programDays'] });
    queryClient.invalidateQueries({ queryKey: ['programExercises'] });
    onClose();
  };

  if (pickingForDay) {
    return <ExercisePicker onSelect={(ex) => addExerciseToDay(pickingForDay, ex)} onClose={() => setPickingForDay(null)} />;
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{isNew ? 'New Program' : 'Edit Program'}</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Program Name</Label>
          <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Upper Lower Split" className="bg-secondary border-0 text-foreground mt-1 h-11" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Goal</Label>
            <Select value={form.goalType} onValueChange={v => setForm({...form, goalType: v})}>
              <SelectTrigger className="bg-secondary border-0 text-foreground mt-1 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['hypertrophy','strength','recomp','general_fitness','cut','lean_bulk'].map(g => <SelectItem key={g} value={g}>{g.replace('_',' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Days/Week</Label>
            <Input type="number" value={form.daysPerWeek} onChange={e => setForm({...form, daysPerWeek: Number(e.target.value)})} className="bg-secondary border-0 text-foreground mt-1 h-11" />
          </div>
        </div>
      </div>

      {/* Training Days */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Training Days</span>
          <button onClick={addDay} className="text-xs text-primary font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add Day</button>
        </div>
        {days.map((day, idx) => (
          <div key={day.id} className="bg-card rounded-xl p-4 border border-border space-y-3">
            <div className="flex items-center gap-2">
              <Input value={day.dayName} onChange={e => {
                const updated = [...days]; updated[idx] = {...day, dayName: e.target.value}; setDays(updated);
              }} className="bg-secondary border-0 text-foreground h-9 flex-1 text-sm" />
              <Select value={day.focus || 'full_body'} onValueChange={v => {
                const updated = [...days]; updated[idx] = {...day, focus: v}; setDays(updated);
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
            {(exercises[day.id] || []).map((ex, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-secondary rounded-lg">
                <span className="text-xs text-foreground">{ex.exerciseName}</span>
                <span className="text-xs text-muted-foreground">{ex.targetSets}×{ex.targetReps}</span>
              </div>
            ))}
            <button onClick={() => setPickingForDay(day.id)}
              className="w-full h-8 text-xs text-primary font-medium flex items-center justify-center gap-1 border border-dashed border-border rounded-lg">
              <Plus className="w-3 h-3" /> Add Exercise
            </button>
          </div>
        ))}
      </div>

      <GradientButton onClick={handleSave} disabled={!form.name || saving} className="w-full h-12 flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Program'}
      </GradientButton>
    </div>
  );
}