import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/localClient';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Check, Dumbbell, ChevronRight, Star } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import ProgramEditor from '@/components/programs/ProgramEditor';

export default function Programs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingProgram, setEditingProgram] = useState(null);

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: () => appClient.entities.WorkoutProgram.list(),
    initialData: [],
  });

  const { data: programDays } = useQuery({
    queryKey: ['programDays'],
    queryFn: () => appClient.entities.ProgramDay.list(),
    initialData: [],
  });

  const setActive = useMutation({
    mutationFn: async (programId) => {
      // Deactivate all first
      const active = programs.filter(p => p.isActive);
      for (const p of active) {
        await appClient.entities.WorkoutProgram.update(p.id, { isActive: false });
      }
      await appClient.entities.WorkoutProgram.update(programId, { isActive: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });

  if (editingProgram !== null) {
    return <ProgramEditor program={editingProgram} onClose={() => {
      setEditingProgram(null);
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programDays'] });
    }} />;
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Programs</h1>
      </div>

      <GradientButton onClick={() => setEditingProgram({})} className="w-full h-12 flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Create Program
      </GradientButton>

      <div className="space-y-2">
        {programs.map(program => {
          const days = programDays.filter(d => d.programId === program.id).sort((a,b) => a.dayOrder - b.dayOrder);
          return (
            <div key={program.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{program.name}</span>
                    {program.isActive && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Active</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {program.daysPerWeek} days/week · {program.goalType?.replace('_', ' ')}
                  </div>
                  {days.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {days.map(d => (
                        <span key={d.id} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{d.dayName}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {!program.isActive && (
                    <button onClick={() => setActive.mutate(program.id)}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center" title="Set Active">
                      <Star className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                  <button onClick={() => setEditingProgram(program)}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {programs.length === 0 && (
        <div className="text-center py-8">
          <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No programs yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Create one or use a starter template.</p>
        </div>
      )}
    </div>
  );
}