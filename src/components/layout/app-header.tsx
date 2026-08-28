import React from 'react';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import DirectionsTransitRoundedIcon from '@mui/icons-material/DirectionsTransitRounded';
import { useI18n } from '@/contexts/i18n-context';
import { StationLayerToggle } from './station-layer-toggle';
import { withViewTransition } from '@/lib/view-transition';

type AppHeaderProps = {
  onOpenSettings: () => void;
};

export function AppHeader({ onOpenSettings }: AppHeaderProps) {
  const { t } = useI18n();

  const handleOpenSettings = () => {
    withViewTransition(() => {
      onOpenSettings();
    });
  };

  return (
    <header className="absolute top-0 inset-x-0 z-30 pt-safe pointer-events-none">
      <div className="flex items-start justify-between px-3 sm:px-4 py-2.5 max-w-7xl mx-auto">
        {/* Leading Corner: Glassmorphic Logo Capsule + Settings Capsule */}
        <div className="pointer-events-auto flex flex-col items-start gap-1.5">
          {/* Logo Capsule */}
          <div className="flex items-center gap-2 h-9 min-w-[120px] px-2.5 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/30 dark:border-white/15 shadow-xl select-none transition-all">
            <div className="size-6 rounded-full bg-[#5e4b8b] border border-[#8f7bb7]/40 shadow-xs flex items-center justify-center shrink-0">
              <DirectionsTransitRoundedIcon sx={{ fontSize: 14 }} className="text-white" />
            </div>
            <span className="text-xs font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {t.headerTitle}
            </span>
          </div>

          {/* Settings Capsule (Matching size and shape) */}
          <button
            type="button"
            onClick={handleOpenSettings}
            aria-label={t.settings}
            className="flex items-center gap-2 h-9 min-w-[120px] px-2.5 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/30 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/90 dark:hover:bg-white/10 active:scale-95 transition-all shadow-xl cursor-pointer select-none">
            <div className="size-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
              <SettingsRoundedIcon sx={{ fontSize: 14 }} className="text-neutral-700 dark:text-neutral-300" />
            </div>
            <span className="text-xs font-semibold">{t.settings}</span>
          </button>
        </div>

        {/* Center Glassmorphic Toggle */}
        <div className="pointer-events-auto">
          <StationLayerToggle />
        </div>

        {/* Spacer for symmetrical balance */}
        <div className="w-12 sm:w-28 pointer-events-none" />
      </div>
    </header>
  );
}
