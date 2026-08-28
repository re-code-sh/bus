import React from 'react';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import { useI18n } from '@/contexts/i18n-context';
import { cn } from '@/lib/utils';

type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onResetBearing: () => void;
  bearing: number;
  isLocating?: boolean;
  className?: string;
};

export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  onResetBearing,
  bearing,
  isLocating,
  className,
}: MapControlsProps) {
  const { t } = useI18n();

  return (
    <div className={cn('flex flex-col gap-2 pointer-events-auto', className)}>
      {/* Compass / Reset Bearing */}
      {Math.abs(bearing) > 1 && (
        <button
          type="button"
          onClick={onResetBearing}
          aria-label="Reset North"
          className="flex items-center justify-center size-10 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/30 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white active:scale-95 shadow-xl transition-all cursor-pointer">
          <ExploreRoundedIcon
            sx={{ fontSize: 22 }}
            className="transition-transform duration-200"
            style={{ transform: `rotate(${-bearing}deg)` }}
          />
        </button>
      )}

      {/* Locate Button */}
      <button
        type="button"
        onClick={onLocate}
        aria-label={t.locateMe}
        disabled={isLocating}
        className={cn(
          'flex items-center justify-center size-10 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/30 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white active:scale-95 shadow-xl transition-all cursor-pointer',
          isLocating && 'animate-pulse text-blue-500 dark:text-blue-400'
        )}>
        <MyLocationRoundedIcon sx={{ fontSize: 20 }} />
      </button>

      {/* Zoom In & Out */}
      <div className="flex flex-col rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/30 dark:border-white/15 shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={onZoomIn}
          aria-label={t.zoomIn}
          className="flex items-center justify-center size-10 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/20 transition-all cursor-pointer">
          <AddRoundedIcon sx={{ fontSize: 20 }} />
        </button>
        <div className="h-[1px] bg-black/10 dark:bg-white/10 w-full" />
        <button
          type="button"
          onClick={onZoomOut}
          aria-label={t.zoomOut}
          className="flex items-center justify-center size-10 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/20 transition-all cursor-pointer">
          <RemoveRoundedIcon sx={{ fontSize: 20 }} />
        </button>
      </div>
    </div>
  );
}
