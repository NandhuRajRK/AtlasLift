import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Save, LogOut, Download } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => appClient.entities.UserProfile.list(),
    initialData: [],
  });

  useEffect(() => {
    if (profiles[0] && !form) setForm({ ...profiles[0] });
  }, [profiles]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
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
    setSaving(false);
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
      </div>

      <GradientButton onClick={handleSave} disabled={saving} className="w-full h-12 flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
      </GradientButton>

      <button onClick={handleExport}
        className="w-full h-11 rounded-xl bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-2">
        <Download className="w-4 h-4" /> Export Data (JSON)
      </button>

      <button onClick={() => appClient.auth.logout()}
        className="w-full h-11 rounded-xl text-destructive font-medium text-sm flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}