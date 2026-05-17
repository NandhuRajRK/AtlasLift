import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { getToday } from '@/lib/dateUtils';
import { Scale } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GradientButton from '@/components/ui/GradientButton';
import BodyweightChart from '@/components/progress/BodyweightChart';
import AdherenceCards from '@/components/progress/AdherenceCards';
import StrengthChart from '@/components/progress/StrengthChart';
import GoalMetricsCard from '@/components/progress/GoalMetricsCard';
import CircumferenceCard from '@/components/progress/CircumferenceCard';
import PhotoTimelineCard from '@/components/progress/PhotoTimelineCard';
import NutritionRecommendationCard from '@/components/progress/NutritionRecommendationCard';
import { GoalCheckinCard, PRHighlightsCard, RecoveryProxyCard } from '@/components/progress/HighlightsCard';
import { selectPrimaryProfile } from '@/lib/profileUtils';
import { toast } from '@/components/ui/use-toast';
import { deleteProgressPhoto, replaceProgressPhoto, uploadProgressPhoto } from '@/lib/progressPhotoService';
import { computeProgressInsights } from '@/lib/progressDomain';

export default function Progress() {
  const today = getToday();
  const queryClient = useQueryClient();
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightVal, setWeightVal] = useState('');
  const [waistVal, setWaistVal] = useState('');
  const [chestVal, setChestVal] = useState('');
  const [armVal, setArmVal] = useState('');
  const [thighVal, setThighVal] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoPageSize, setPhotoPageSize] = useState(9);

  const { data: metrics } = useQuery({
    queryKey: ['bodyMetrics'],
    queryFn: () => appClient.entities.BodyMetric.list('-date', 60),
    initialData: [],
  });

  const { data: sessions } = useQuery({
    queryKey: ['allWorkoutSessions'],
    queryFn: () => appClient.entities.WorkoutSession.list('-date', 120),
    initialData: [],
  });

  const { data: sets } = useQuery({
    queryKey: ['allWorkoutSets'],
    queryFn: () => appClient.entities.WorkoutSet.list('-created_date', 2000),
    initialData: [],
  });

  const { data: meals } = useQuery({
    queryKey: ['allMealsForProgress'],
    queryFn: () => appClient.entities.MealLog.list('-date', 1200),
    initialData: [],
  });

  const { data: hydrationEntries } = useQuery({
    queryKey: ['allHydrationForProgress'],
    queryFn: () => appClient.entities.HydrationEntry.list('-date', 1200),
    initialData: [],
  });

  const { data: profiles } = useQuery({ queryKey: ['userProfile'], queryFn: () => appClient.entities.UserProfile.list('-created_date', 50), initialData: [] });
  const profile = selectPrimaryProfile(profiles) || {};
  const goalType = profile.goalType || 'general_fitness';
  const showAdvancedMeasurements = Boolean(profile.enableAdvancedBodyMeasurements);

  const {
    cards,
    circumferenceCards,
    photoMetrics,
    goalCheckins,
    calorieAdjust,
    prHighlights,
    recoveryDaysPerWeek,
    avgRecoveryDaysPerWeek,
  } = useMemo(
    () =>
      computeProgressInsights({
        metrics,
        sessions,
        sets,
        meals,
        hydrationEntries,
        profile,
        goalType,
        showAdvancedMeasurements,
        photoLimit: 20,
      }),
    [metrics, sessions, sets, meals, hydrationEntries, profile, goalType, showAdvancedMeasurements]
  );
  const visiblePhotos = photoMetrics.slice(0, photoPageSize);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setPhotoSaving(true);
        const photoUrl = reader.result;
        await uploadProgressPhoto({ date: today, dataUrl: photoUrl });
        queryClient.invalidateQueries({ queryKey: ['bodyMetrics'] });
      } finally {
        setPhotoSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const replacePhoto = async (metricId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setPhotoSaving(true);
        await replaceProgressPhoto({ metricId, dataUrl: reader.result });
        await queryClient.invalidateQueries({ queryKey: ['bodyMetrics'] });
        toast({ title: 'Photo replaced' });
      } finally {
        setPhotoSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const deletePhoto = async (metric) => {
    await deleteProgressPhoto(metric);
    await queryClient.invalidateQueries({ queryKey: ['bodyMetrics'] });
    toast({ title: 'Photo removed' });
  };

  const logWeight = useMutation({
    mutationFn: () => appClient.entities.BodyMetric.create({
      date: today,
      bodyweightKg: Number(weightVal),
      waistCm: waistVal ? Number(waistVal) : undefined,
      chestCm: showAdvancedMeasurements && chestVal ? Number(chestVal) : undefined,
      armCm: showAdvancedMeasurements && armVal ? Number(armVal) : undefined,
      thighCm: showAdvancedMeasurements && thighVal ? Number(thighVal) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyMetrics'] });
      setShowWeightForm(false);
      setWeightVal('');
      setWaistVal('');
      setChestVal('');
      setArmVal('');
      setThighVal('');
    },
  });

  const todayWeight = metrics.find((m) => m.date === today && Number.isFinite(Number(m.bodyweightKg)));

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-lg font-bold text-foreground">Progress</h1>

      <GoalMetricsCard goalType={goalType} cards={cards} />

      {/* Log Weight */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-chart-4" />
            <span className="text-sm font-semibold text-foreground">Bodyweight</span>
          </div>
          {todayWeight ? (
            <span className="text-sm font-bold text-foreground">{todayWeight.bodyweightKg} kg</span>
          ) : (
            <button onClick={() => setShowWeightForm(true)} className="text-xs text-primary font-medium">Log Today</button>
          )}
        </div>
        {showWeightForm && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                <Input type="number" value={weightVal} onChange={e => setWeightVal(e.target.value)}
                  placeholder={profile.currentWeightKg?.toString() || '73'} className="bg-secondary border-0 text-foreground mt-1 h-11" />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Waist (cm, optional)</Label>
                <Input type="number" value={waistVal} onChange={e => setWaistVal(e.target.value)}
                  placeholder="80" className="bg-secondary border-0 text-foreground mt-1 h-11" />
              </div>
            </div>
            {showAdvancedMeasurements && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Chest (cm)</Label>
                  <Input type="number" value={chestVal} onChange={e => setChestVal(e.target.value)}
                    placeholder="95" className="bg-secondary border-0 text-foreground mt-1 h-11" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Arm (cm)</Label>
                  <Input type="number" value={armVal} onChange={e => setArmVal(e.target.value)}
                    placeholder="34" className="bg-secondary border-0 text-foreground mt-1 h-11" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Thigh (cm)</Label>
                  <Input type="number" value={thighVal} onChange={e => setThighVal(e.target.value)}
                    placeholder="55" className="bg-secondary border-0 text-foreground mt-1 h-11" />
                </div>
              </div>
            )}
            <GradientButton onClick={() => logWeight.mutate()} disabled={!weightVal || logWeight.isPending} className="w-full h-11">
              {logWeight.isPending ? 'Saving...' : 'Save'}
            </GradientButton>
          </div>
        )}
      </div>

      {/* Bodyweight Chart */}
      <BodyweightChart metrics={metrics} />

      {/* Adherence */}
      <AdherenceCards profile={profile} />

      {/* Strength */}
      <StrengthChart />

      <CircumferenceCard items={circumferenceCards} />

      <PhotoTimelineCard
        photoSaving={photoSaving}
        onAddPhoto={handlePhotoUpload}
        photoMetrics={photoMetrics}
        visiblePhotos={visiblePhotos}
        onReplacePhoto={replacePhoto}
        onDeletePhoto={deletePhoto}
        onLoadMorePhotos={() => setPhotoPageSize((n) => n + 9)}
      />

      <GoalCheckinCard goalType={goalType} goalCheckins={goalCheckins} />

      <NutritionRecommendationCard calorieAdjust={calorieAdjust} />

      <PRHighlightsCard goalType={goalType} prHighlights={prHighlights} />

      <RecoveryProxyCard
        goalType={goalType}
        recoveryDaysPerWeek={recoveryDaysPerWeek}
        avgRecoveryDaysPerWeek={avgRecoveryDaysPerWeek}
      />
    </div>
  );
}
