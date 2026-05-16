import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { useNavigate } from 'react-router-dom';
import { selectPrimaryProfile } from '@/lib/profileUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Save, Download } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => appClient.entities.UserProfile.list('-created_date', 50),
    initialData: [],
  });

  useEffect(() => {
    const selectedProfile = selectPrimaryProfile(profiles);
    if (selectedProfile && !form) setForm({ ...selectedProfile });
  }, [profiles]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const numberOrNaN = (value) => {
    if (value === '' || value === null || value === undefined) return NaN;
    return Number(value);
  };

  const errors = (() => {
    if (!form) return {};
    const next = {};
    const height = numberOrNaN(form.heightCm);
    const weight = numberOrNaN(form.currentWeightKg);
    const targetWeight = form.targetWeightKg === '' || form.targetWeightKg == null ? NaN : Number(form.targetWeightKg);
    const calories = numberOrNaN(form.calorieTarget);
    const protein = numberOrNaN(form.proteinTarget);
    const carbs = numberOrNaN(form.carbTarget);
    const fat = numberOrNaN(form.fatTarget);
    const water = numberOrNaN(form.waterTargetMl);
    const training = numberOrNaN(form.trainingDaysPerWeek);
    const age = form.age === '' || form.age == null ? NaN : Number(form.age);

    if (!Number.isFinite(height) || height < 80 || height > 260) next.heightCm = 'Height must be between 80 and 260 cm';
    if (!Number.isFinite(weight) || weight < 25 || weight > 400) next.currentWeightKg = 'Weight must be between 25 and 400 kg';
    if (!Number.isNaN(targetWeight) && (!Number.isFinite(targetWeight) || targetWeight < 25 || targetWeight > 400)) next.targetWeightKg = 'Target weight must be between 25 and 400 kg';
    if (!Number.isFinite(calories) || calories < 800 || calories > 8000) next.calorieTarget = 'Calories must be between 800 and 8000';
    if (!Number.isFinite(protein) || protein < 20 || protein > 500) next.proteinTarget = 'Protein must be between 20 and 500 g';
    if (!Number.isFinite(carbs) || carbs < 20 || carbs > 1000) next.carbTarget = 'Carbs must be between 20 and 1000 g';
    if (!Number.isFinite(fat) || fat < 10 || fat > 300) next.fatTarget = 'Fat must be between 10 and 300 g';
    if (!Number.isFinite(water) || water < 500 || water > 10000) next.waterTargetMl = 'Water target must be between 500 and 10000 ml';
    if (!Number.isFinite(training) || training < 1 || training > 7) next.trainingDaysPerWeek = 'Training days must be between 1 and 7';
    if (!Number.isNaN(age) && (!Number.isFinite(age) || age < 10 || age > 100)) next.age = 'Age must be between 10 and 100';

    return next;
  })();

  const handleSave = async () => {
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const { id, created_date, updated_date, created_by, ...data } = form;
      await appClient.entities.UserProfile.update(form.id, {
        ...data,
        age: data.age ? Number(data.age) : undefined,
        heightCm: Number(data.heightCm),
        currentWeightKg: Number(data.currentWeightKg),
        targetWeightKg: data.targetWeightKg ? Number(data.targetWeightKg) : undefined,
        calorieTarget: Number(data.calorieTarget),
        proteinTarget: Number(data.proteinTarget),
        carbTarget: Number(data.carbTarget),
        fatTarget: Number(data.fatTarget),
        waterTargetMl: Number(data.waterTargetMl),
        trainingDaysPerWeek: Number(data.trainingDaysPerWeek),
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    const [workouts, meals, hydration, metrics] = await Promise.all([
      appClient.entities.WorkoutSession.list('-date', 100),
      appClient.entities.MealLog.list('-date', 500),
      appClient.entities.HydrationEntry.list('-date', 500),
      appClient.entities.BodyMetric.list('-date', 100),
    ]);
    const data = { workouts, meals, hydration, metrics, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-lift-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!form) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const fields = [
    { field: 'name', label: 'Name', type: 'text' },
    { field: 'age', label: 'Age', type: 'number' },
    { field: 'heightCm', label: 'Height (cm)', type: 'number' },
    { field: 'currentWeightKg', label: 'Current Weight (kg)', type: 'number' },
    { field: 'targetWeightKg', label: 'Target Weight (kg)', type: 'number' },
    { field: 'calorieTarget', label: 'Calorie Target', type: 'number' },
    { field: 'proteinTarget', label: 'Protein Target (g)', type: 'number' },
    { field: 'carbTarget', label: 'Carb Target (g)', type: 'number' },
    { field: 'fatTarget', label: 'Fat Target (g)', type: 'number' },
    { field: 'waterTargetMl', label: 'Water Target (ml)', type: 'number' },
    { field: 'trainingDaysPerWeek', label: 'Training Days/Week', type: 'number' },
  ];

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Profile & Settings</h1>
      </div>

      <div className="space-y-4">
        {fields.map(f => (
          <div key={f.field}>
            <Label className="text-xs text-muted-foreground">{f.label}</Label>
            <Input type={f.type} value={form[f.field] || ''} onChange={e => update(f.field, e.target.value)}
              className="bg-secondary border-0 text-foreground mt-1 h-11" />
            {errors[f.field] && <p className="text-[11px] text-destructive mt-1">{errors[f.field]}</p>}
          </div>
        ))}

        <div>
          <Label className="text-xs text-muted-foreground">Goal</Label>
          <Select value={form.goalType || 'recomp'} onValueChange={v => update('goalType', v)}>
            <SelectTrigger className="bg-secondary border-0 text-foreground mt-1 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['cut','lean_bulk','recomp','maintain','strength','general_fitness'].map(g => (
                <SelectItem key={g} value={g}>{g.replace('_',' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Experience Level</Label>
          <Select value={form.experienceLevel || 'beginner'} onValueChange={v => update('experienceLevel', v)}>
            <SelectTrigger className="bg-secondary border-0 text-foreground mt-1 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['beginner','intermediate','advanced'].map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Advanced Body Measurements</p>
              <p className="text-xs text-muted-foreground mt-0.5">Show chest, arm, and thigh inputs in Progress logging.</p>
            </div>
            <button
              type="button"
              onClick={() => update('enableAdvancedBodyMeasurements', !form.enableAdvancedBodyMeasurements)}
              className={`h-7 px-3 rounded-full text-xs font-semibold ${
                form.enableAdvancedBodyMeasurements ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}
            >
              {form.enableAdvancedBodyMeasurements ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </div>

      <GradientButton onClick={handleSave} disabled={saving || Object.keys(errors).length > 0} className="w-full h-12 flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
      </GradientButton>

      <button onClick={handleExport}
        className="w-full h-11 rounded-xl bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-2">
        <Download className="w-4 h-4" /> Export Data (JSON)
      </button>

    </div>
  );
}
