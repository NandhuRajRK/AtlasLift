import React from 'react';

export function GoalCheckinCard({ goalType, goalCheckins }) {
  if (!(goalType === 'cut' || goalType === 'lean_bulk' || goalType === 'recomp') || !goalCheckins[goalType]) return null;
  return (
    <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{goalCheckins[goalType].title}</div>
      <ul className="space-y-1">
        {goalCheckins[goalType].points.map((point) => (
          <li key={point} className="text-sm text-foreground">• {point}</li>
        ))}
      </ul>
    </div>
  );
}

export function PRHighlightsCard({ goalType, prHighlights }) {
  if (!(goalType === 'strength' || goalType === 'lean_bulk' || goalType === 'recomp')) return null;
  return (
    <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">PR Highlights</div>
      {prHighlights.length > 0 ? (
        prHighlights.map((pr) => (
          <div key={pr.name} className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2">
            <span className="text-sm text-foreground">{pr.name}</span>
            <span className="text-xs text-muted-foreground">{pr.weight > 0 ? `${pr.weight} kg` : ''}{pr.weight > 0 && pr.reps > 0 ? ' × ' : ''}{pr.reps > 0 ? `${pr.reps} reps` : ''}</span>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No PR data yet.</p>
      )}
    </div>
  );
}

export function RecoveryProxyCard({ goalType, recoveryDaysPerWeek, avgRecoveryDaysPerWeek }) {
  if (!(goalType === 'strength' || goalType === 'general_fitness' || goalType === 'maintain')) return null;
  return (
    <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recovery Proxy</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-secondary p-3">
          <div className="text-[11px] text-muted-foreground">Planned Recovery/Week</div>
          <div className="text-sm font-bold text-foreground mt-1">{recoveryDaysPerWeek.toFixed(1)} days</div>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <div className="text-[11px] text-muted-foreground">Actual Recovery/Week</div>
          <div className="text-sm font-bold text-foreground mt-1">{avgRecoveryDaysPerWeek.toFixed(1)} days</div>
        </div>
      </div>
    </div>
  );
}

