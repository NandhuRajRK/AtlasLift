import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { Input } from '@/components/ui/input';
import { Search, X, Dumbbell } from 'lucide-react';

export default function ExercisePicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');

  const { data: exercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => appClient.entities.Exercise.list('name', 100),
    initialData: [],
  });

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.primaryMuscle?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  filtered.forEach(e => {
    const muscle = e.primaryMuscle || 'other';
    if (!grouped[muscle]) grouped[muscle] = [];
    grouped[muscle].push(e);
  });

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Add Exercise</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises..."
          className="pl-10 h-11 bg-secondary border-0 text-foreground" />
      </div>
      <div className="space-y-4">
        {Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([muscle, exs]) => (
          <div key={muscle}>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 capitalize">{muscle}</div>
            <div className="space-y-1">
              {exs.map(ex => (
                <button key={ex.id} onClick={() => onSelect(ex)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border active:scale-[0.98] transition-transform text-left">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{ex.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{ex.equipment} · {ex.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No exercises found</p>
        )}
      </div>
    </div>
  );
}