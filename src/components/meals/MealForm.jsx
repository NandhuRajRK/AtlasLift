import React, { useState } from 'react';
import { appClient } from '@/api/localClient';
import { getToday } from '@/lib/dateUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Bookmark } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'pre_workout', label: 'Pre-Workout' },
  { value: 'post_workout', label: 'Post-Workout' },
];

// editMeal: existing MealLog record to edit
// prefill: SavedMeal template to prefill from
export default function MealForm({ onClose, prefill, editMeal }) {
  const [saving, setSaving] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [form, setForm] = useState({
    name: editMeal?.name || prefill?.name || '',
    mealType: editMeal?.mealType || prefill?.defaultMealType || 'lunch',
    calories: editMeal?.calories ?? prefill?.calories ?? '',
    protein: editMeal?.protein ?? prefill?.protein ?? '',
    carbs: editMeal?.carbs ?? prefill?.carbs ?? '',
    fat: editMeal?.fat ?? prefill?.fat ?? '',
  });

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    const data = {
      name: form.name,
      mealType: form.mealType,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    };
    if (editMeal) {
      await appClient.entities.MealLog.update(editMeal.id, data);
    } else {
      await appClient.entities.MealLog.create({ date: getToday(), ...data });
    }
    onClose();
  };

  const handleSaveAsTemplate = async () => {
    await appClient.entities.SavedMeal.create({
      name: form.name,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      defaultMealType: form.mealType,
    });
    setTemplateSaved(true);
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{editMeal ? 'Edit Meal' : 'Log Meal'}</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Meal Name</Label>
          <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Chicken rice bowl" className="bg-secondary border-0 text-foreground mt-1.5 h-12" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Meal Type</Label>
          <Select value={form.mealType} onValueChange={v => update('mealType', v)}>
            <SelectTrigger className="bg-secondary border-0 text-foreground mt-1.5 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { field: 'calories', label: 'Calories', ph: '450' },
            { field: 'protein', label: 'Protein (g)', ph: '35' },
            { field: 'carbs', label: 'Carbs (g)', ph: '45' },
            { field: 'fat', label: 'Fat (g)', ph: '15' },
          ].map(f => (
            <div key={f.field}>
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              <Input type="number" value={form[f.field]} onChange={e => update(f.field, e.target.value)}
                placeholder={f.ph} className="bg-secondary border-0 text-foreground mt-1.5 h-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <GradientButton onClick={handleSave} disabled={!form.name || saving} className="w-full h-12 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : editMeal ? 'Update Meal' : 'Log Meal'}
        </GradientButton>
        {form.name && !editMeal && (
          <button onClick={handleSaveAsTemplate} disabled={templateSaved}
            className="w-full h-10 text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5 hover:text-foreground transition-colors disabled:opacity-50">
            <Bookmark className="w-3.5 h-3.5" /> {templateSaved ? 'Saved as Template ✓' : 'Save as Template'}
          </button>
        )}
      </div>
    </div>
  );
}