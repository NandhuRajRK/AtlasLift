import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { getToday, getDateRange } from '@/lib/dateUtils';
import { Scale, TrendingUp, Dumbbell, Droplets, UtensilsCrossed } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GradientButton from '@/components/ui/GradientButton';
import BodyweightChart from '@/components/progress/BodyweightChart';
import AdherenceCards from '@/components/progress/AdherenceCards';
import StrengthChart from '@/components/progress/StrengthChart';

export default function Progress() {
  const today = getToday();
  const queryClient = useQueryClient();
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightVal, setWeightVal] = useState('');
  const [waistVal, setWaistVal] = useState('');

  const { data: metrics } = useQuery({
    queryKey: ['bodyMetrics'],
    queryFn: () => appClient.entities.BodyMetric.list('-date', 60),
    initialData: [],
  });

  const { data: profiles } = useQuery({ queryKey: ['userProfile'], queryFn: () => appClient.entities.UserProfile.list(), initialData: [] });
  const profile = profiles[0] || {};

  const logWeight = useMutation({
    mutationFn: () => appClient.entities.BodyMetric.create({
      date: today,
      bodyweightKg: Number(weightVal),
      waistCm: waistVal ? Number(waistVal) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyMetrics'] });
      setShowWeightForm(false);
      setWeightVal('');
      setWaistVal('');
    },
  });

  const todayWeight = metrics.find(m => m.date === today);

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-lg font-bold text-foreground">Progress</h1>

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
    </div>
  );
}