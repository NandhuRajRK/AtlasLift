import React, { useState } from 'react';
import { appClient } from '@/api/localClient';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import GradientButton from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const GOALS = [
  { value: 'cut', label: 'Cut', desc: 'Lose fat, preserve muscle' },
  { value: 'lean_bulk', label: 'Lean Bulk', desc: 'Build muscle with minimal fat' },
  { value: 'recomp', label: 'Recomposition', desc: 'Lose fat and build muscle' },
  { value: 'maintain', label: 'Maintain', desc: 'Keep current physique' },
  { value: 'strength', label: 'Strength', desc: 'Get stronger overall' },
  { value: 'general_fitness', label: 'General Fitness', desc: 'Improve overall health' },
];

const EXPERIENCE = [
  { value: 'beginner', label: 'Beginner', desc: '0–1 years of training' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 years of training' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years of training' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => appClient.entities.UserProfile.list('-created_date', 50),
    initialData: [],
  });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '', age: '', heightCm: '', currentWeightKg: '',
    goalType: 'recomp', experienceLevel: 'beginner',
    calorieTarget: 2200, proteinTarget: 160, carbTarget: 220, fatTarget: 65,
    waterTargetMl: 3000, trainingDaysPerWeek: 4, preferredUnits: 'metric',
  });

  const update = (field, value) => setProfile(p => ({ ...p, [field]: value }));

  const asNumber = (value) => {
    if (value === '' || value === null || value === undefined) return NaN;
    return Number(value);
  };

  const errors = (() => {
    const next = {};
    const age = profile.age === '' ? NaN : Number(profile.age);
    const height = asNumber(profile.heightCm);
    const weight = asNumber(profile.currentWeightKg);
    const calories = asNumber(profile.calorieTarget);
    const protein = asNumber(profile.proteinTarget);
    const carbs = asNumber(profile.carbTarget);
    const fat = asNumber(profile.fatTarget);
    const water = asNumber(profile.waterTargetMl);
    const days = asNumber(profile.trainingDaysPerWeek);

    if (!Number.isNaN(age) && (!Number.isFinite(age) || age < 10 || age > 100)) next.age = 'Age must be between 10 and 100';
    if (!Number.isFinite(height) || height < 80 || height > 260) next.heightCm = 'Height must be between 80 and 260 cm';
    if (!Number.isFinite(weight) || weight < 25 || weight > 400) next.currentWeightKg = 'Weight must be between 25 and 400 kg';
    if (!Number.isFinite(calories) || calories < 800 || calories > 8000) next.calorieTarget = 'Calories must be between 800 and 8000';
    if (!Number.isFinite(protein) || protein < 20 || protein > 500) next.proteinTarget = 'Protein must be between 20 and 500 g';
    if (!Number.isFinite(carbs) || carbs < 20 || carbs > 1000) next.carbTarget = 'Carbs must be between 20 and 1000 g';
    if (!Number.isFinite(fat) || fat < 10 || fat > 300) next.fatTarget = 'Fat must be between 10 and 300 g';
    if (!Number.isFinite(water) || water < 500 || water > 10000) next.waterTargetMl = 'Water target must be between 500 and 10000 ml';
    if (!Number.isFinite(days) || days < 1 || days > 7) next.trainingDaysPerWeek = 'Training days must be between 1 and 7';
    return next;
  })();

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (Object.keys(errors).length > 0) return;
      const payload = {
        ...profile,
        age: profile.age ? Number(profile.age) : undefined,
        heightCm: Number(profile.heightCm),
        currentWeightKg: Number(profile.currentWeightKg),
        calorieTarget: Number(profile.calorieTarget),
        proteinTarget: Number(profile.proteinTarget),
        carbTarget: Number(profile.carbTarget),
        fatTarget: Number(profile.fatTarget),
        waterTargetMl: Number(profile.waterTargetMl),
        trainingDaysPerWeek: Number(profile.trainingDaysPerWeek),
        onboardingComplete: true,
      };

      const latestProfile = profiles[0];
      if (latestProfile?.id) {
        await appClient.entities.UserProfile.update(latestProfile.id, payload);
      } else {
        await appClient.entities.UserProfile.create(payload);
      }

      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      navigate('/');
    } catch (error) {
      console.error('Failed to finish onboarding:', error);
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !errors.heightCm && !errors.currentWeightKg && !errors.age;
    if (step === 2) return !errors.calorieTarget && !errors.proteinTarget && !errors.carbTarget && !errors.fatTarget && !errors.waterTargetMl;
    if (step === 3) return !errors.trainingDaysPerWeek;
    return true;
  };

  const steps = [
    // Step 0: Basic profile
    <div key="basic" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Your Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">Let's get the basics down.</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Name (optional)</Label>
          <Input value={profile.name} onChange={e => update('name', e.target.value)} placeholder="Your name" className="bg-secondary border-border text-foreground mt-1.5 h-12" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Age (optional)</Label>
          <Input type="number" value={profile.age} onChange={e => update('age', e.target.value)} placeholder="25" className="bg-secondary border-border text-foreground mt-1.5 h-12" />
          {errors.age && <p className="text-[11px] text-destructive mt-1">{errors.age}</p>}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Height (cm)</Label>
          <Input type="number" value={profile.heightCm} onChange={e => update('heightCm', e.target.value)} placeholder="176" className="bg-secondary border-border text-foreground mt-1.5 h-12" />
          {errors.heightCm && <p className="text-[11px] text-destructive mt-1">{errors.heightCm}</p>}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Current Weight (kg)</Label>
          <Input type="number" value={profile.currentWeightKg} onChange={e => update('currentWeightKg', e.target.value)} placeholder="73" className="bg-secondary border-border text-foreground mt-1.5 h-12" />
          {errors.currentWeightKg && <p className="text-[11px] text-destructive mt-1">{errors.currentWeightKg}</p>}
        </div>
      </div>
    </div>,

    // Step 1: Goal
    <div key="goal" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Your Goal</h2>
        <p className="text-sm text-muted-foreground mt-1">What are you working toward?</p>
      </div>
      <div className="space-y-2.5">
        {GOALS.map(g => (
          <button key={g.value} onClick={() => update('goalType', g.value)}
            className={`w-full p-4 rounded-xl text-left transition-all border ${
              profile.goalType === g.value
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-muted-foreground/30'
            }`}>
            <div className="font-semibold text-sm text-foreground">{g.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{g.desc}</div>
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Nutrition
    <div key="nutrition" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Nutrition Targets</h2>
        <p className="text-sm text-muted-foreground mt-1">Set your daily macro goals.</p>
      </div>
      <div className="space-y-4">
        {[ 
          { field: 'calorieTarget', label: 'Calories (kcal)', ph: '2200' },
          { field: 'proteinTarget', label: 'Protein (g)', ph: '160' },
          { field: 'carbTarget', label: 'Carbs (g)', ph: '220' },
          { field: 'fatTarget', label: 'Fat (g)', ph: '65' },
          { field: 'waterTargetMl', label: 'Water Target (ml)', ph: '3000' },
        ].map(f => (
          <div key={f.field}>
            <Label className="text-xs text-muted-foreground">{f.label}</Label>
            <Input type="number" value={profile[f.field]} onChange={e => update(f.field, e.target.value)} placeholder={f.ph} className="bg-secondary border-border text-foreground mt-1.5 h-12" />
            {errors[f.field] && <p className="text-[11px] text-destructive mt-1">{errors[f.field]}</p>}
          </div>
        ))}
      </div>
    </div>,

    // Step 3: Training
    <div key="training" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Training Setup</h2>
        <p className="text-sm text-muted-foreground mt-1">Tell us about your training.</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Experience Level</Label>
          <div className="space-y-2.5">
            {EXPERIENCE.map(e => (
              <button key={e.value} onClick={() => update('experienceLevel', e.value)}
                className={`w-full p-4 rounded-xl text-left transition-all border ${
                  profile.experienceLevel === e.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }`}>
                <div className="font-semibold text-sm text-foreground">{e.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{e.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Training Days Per Week</Label>
          <div className="flex gap-2 mt-2">
            {[2,3,4,5,6].map(d => (
              <button key={d} onClick={() => update('trainingDaysPerWeek', d)}
                className={`flex-1 h-12 rounded-xl font-bold text-sm transition-all border ${
                  profile.trainingDaysPerWeek === d
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                }`}>
                {d}
              </button>
            ))}
          </div>
          {errors.trainingDaysPerWeek && <p className="text-[11px] text-destructive mt-1">{errors.trainingDaysPerWeek}</p>}
        </div>
      </div>
    </div>,

    // Step 4: Confirmation
    <div key="confirm" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Ready to Lift</h2>
        <p className="text-sm text-muted-foreground mt-1">Here's your setup.</p>
      </div>
      <div className="space-y-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-xs text-muted-foreground mb-2 font-medium">DAILY TARGETS</div>
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-xs text-muted-foreground">Calories</span><div className="font-bold text-foreground">{profile.calorieTarget} kcal</div></div>
            <div><span className="text-xs text-muted-foreground">Protein</span><div className="font-bold text-foreground">{profile.proteinTarget}g</div></div>
            <div><span className="text-xs text-muted-foreground">Carbs</span><div className="font-bold text-foreground">{profile.carbTarget}g</div></div>
            <div><span className="text-xs text-muted-foreground">Fat</span><div className="font-bold text-foreground">{profile.fatTarget}g</div></div>
            <div><span className="text-xs text-muted-foreground">Water</span><div className="font-bold text-foreground">{profile.waterTargetMl} ml</div></div>
            <div><span className="text-xs text-muted-foreground">Training</span><div className="font-bold text-foreground">{profile.trainingDaysPerWeek}x/week</div></div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-xs text-muted-foreground mb-1 font-medium">GOAL</div>
          <div className="font-bold text-foreground capitalize">{profile.goalType?.replace('_', ' ')}</div>
          <div className="text-xs text-muted-foreground mt-1 capitalize">{profile.experienceLevel} lifter</div>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="flex justify-center min-h-screen bg-background">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col px-5 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold tracking-widest text-primary uppercase">Atlas Lift</div>
          <div className="text-xs text-muted-foreground">{step + 1}/5</div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-secondary rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / 5) * 100}%` }} />
        </div>

        {/* Content */}
        <div className="flex-1">{steps[step]}</div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6 pb-4">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="h-12 px-5 rounded-xl bg-secondary text-foreground font-medium text-sm flex items-center gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < 4 ? (
            <GradientButton onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="flex-1 h-12 flex items-center justify-center gap-1.5">
              Next <ChevronRight className="w-4 h-4" />
            </GradientButton>
          ) : (
            <GradientButton onClick={handleFinish} disabled={saving || Object.keys(errors).length > 0} className="flex-1 h-12 flex items-center justify-center gap-1.5">
              {saving ? 'Setting up...' : 'Start Using Atlas Lift'} <Check className="w-4 h-4" />
            </GradientButton>
          )}
        </div>
      </div>
    </div>
  );
}
