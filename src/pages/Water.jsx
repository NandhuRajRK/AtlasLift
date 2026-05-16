import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { getToday } from '@/lib/dateUtils';
import { format } from 'date-fns';
import { Droplets, Plus, Trash2 } from 'lucide-react';
import ProgressRing from '@/components/ui/ProgressRing';
import GradientButton from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';

const QUICK_ADD = [250, 500, 750, 1000];

export default function Water() {
  const today = getToday();
  const queryClient = useQueryClient();
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const { data: profiles } = useQuery({ queryKey: ['userProfile'], queryFn: () => appClient.entities.UserProfile.list(), initialData: [] });
  const profile = profiles[0] || {};
  const target = profile.waterTargetMl || 3000;

  const { data: entries } = useQuery({
    queryKey: ['hydration', today],
    queryFn: () => appClient.entities.HydrationEntry.filter({ date: today }),
    initialData: [],
  });

  const total = entries.reduce((s, e) => s + (e.amountMl || 0), 0);
  const progress = Math.min((total / target) * 100, 100);

  const addWater = useMutation({
    mutationFn: (amount) => appClient.entities.HydrationEntry.create({
      date: today,
      amountMl: amount,
      drinkType: 'water',
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hydration', today] }),
  });

  const deleteEntry = useMutation({
    mutationFn: (id) => appClient.entities.HydrationEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hydration', today] }),
  });

  const handleCustomAdd = () => {
    const amt = Number(customAmount);
    if (amt > 0) {
      addWater.mutate(amt);
      setCustomAmount('');
      setShowCustom(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-lg font-bold text-foreground">Hydration</h1>

      {/* Progress Ring */}
      <div className="bg-card rounded-2xl p-6 border border-border flex flex-col items-center">
        <ProgressRing progress={progress} size={140} strokeWidth={8} color="hsl(200, 60%, 50%)">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <div className="text-xs text-muted-foreground">/ {target} ml</div>
          </div>
        </ProgressRing>
        <div className="mt-4 text-sm text-muted-foreground">
          {total >= target ? '🎯 Target reached!' : `${target - total} ml remaining`}
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quick Add</div>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ADD.map(amount => (
            <button key={amount} onClick={() => addWater.mutate(amount)}
              className="h-14 rounded-xl bg-card border border-border text-foreground font-semibold text-sm flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform">
              <Droplets className="w-4 h-4 text-chart-3" />
              <span>{amount >= 1000 ? `${amount/1000}L` : `${amount}ml`}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div className="flex gap-2">
        <button onClick={() => setShowCustom(!showCustom)}
          className="h-11 px-4 rounded-xl bg-secondary text-foreground font-medium text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Custom Amount
        </button>
      </div>

      {showCustom && (
        <div className="flex gap-2">
          <Input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
            placeholder="Amount in ml" className="bg-secondary border-0 text-foreground h-12 flex-1" />
          <GradientButton onClick={handleCustomAdd} className="px-6 h-12">Add</GradientButton>
        </div>
      )}

      {/* Today's Log */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Today's Log</div>
          {entries.sort((a,b) => new Date(b.created_date) - new Date(a.created_date)).map(entry => (
            <div key={entry.id} className="flex items-center justify-between bg-card rounded-xl p-3 border border-border">
              <div className="flex items-center gap-3">
                <Droplets className="w-4 h-4 text-chart-3" />
                <div>
                  <span className="text-sm font-medium text-foreground">{entry.amountMl} ml</span>
                  <span className="text-xs text-muted-foreground ml-2">water</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {entry.created_date ? format(new Date(entry.created_date), 'h:mm a') : ''}
                </span>
                <button onClick={() => deleteEntry.mutate(entry.id)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}