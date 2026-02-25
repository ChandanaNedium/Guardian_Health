import React from 'react';

export default function HeatmapLegend() {
  return (
    <div className="flex items-center gap-4 text-xs font-medium">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-emerald-500" /> Safe
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-amber-500" /> Medium
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-500" /> High
      </span>
    </div>
  );
}
