import React from 'react';

export default function MacroBar({ label, current, target, unit = 'g', color = 'bg-primary' }) {
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">
          {Math.round(current)}<span className="text-muted-foreground font-normal">/{target}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}