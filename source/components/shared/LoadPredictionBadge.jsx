import React from 'react';
import { cn } from '@/lib/utils';

const colors = {
  safe: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

export default function LoadPredictionBadge({ level }) {
  const l = level || 'safe';
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border', colors[l])}>
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-emerald-500': l === 'safe',
        'bg-amber-500': l === 'medium',
        'bg-red-500': l === 'high',
      })} />
      {l === 'safe' ? 'Safe' : l === 'medium' ? 'Medium Load' : 'High Load'}
    </span>
  );
}
