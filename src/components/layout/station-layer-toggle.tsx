import React, { type ElementType } from 'react';
import TrainRoundedIcon from '@mui/icons-material/TrainRounded';
import DirectionsBusRoundedIcon from '@mui/icons-material/DirectionsBusRounded';
import { useI18n } from '@/contexts/i18n-context';
import { LAYER_KEYS, useMapLayers, type LayerKey } from '@/contexts/map-layers-context';
import { withViewTransition } from '@/lib/view-transition';
import { cn } from '@/lib/utils';

const LAYER_META: Record<
  LayerKey,
  { icon: ElementType; labelKey: 'layerMetro' | 'layerBrt' | 'layerBus' }
> = {
  metro: { icon: TrainRoundedIcon, labelKey: 'layerMetro' },
  brt: { icon: DirectionsBusRoundedIcon, labelKey: 'layerBrt' },
  bus: { icon: DirectionsBusRoundedIcon, labelKey: 'layerBus' },
};

export function StationLayerToggle() {
  const { t } = useI18n();
  const { visibleLayers, toggleLayer } = useMapLayers();

  const handleToggle = (key: LayerKey) => {
    withViewTransition(() => {
      toggleLayer(key);
    });
  };

  return (
    <div className="flex items-center bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-full border border-white/30 dark:border-white/15 p-1 shadow-xl pointer-events-auto">
      {LAYER_KEYS.map((key, index) => {
        const selected = visibleLayers.has(key);
        const prevKey = index > 0 ? LAYER_KEYS[index - 1] : null;
        const prevSelected = prevKey ? visibleLayers.has(prevKey) : false;
        const showDivider = index > 0 && !selected && !prevSelected;
        const Icon = LAYER_META[key].icon;

        return (
          <React.Fragment key={key}>
            {showDivider && <div className="w-[1px] h-3.5 bg-black/10 dark:bg-white/20 my-auto" />}
            <button
              type="button"
              onClick={() => handleToggle(key)}
              aria-pressed={selected}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer select-none active:scale-95',
                selected
                  ? 'bg-neutral-900/10 dark:bg-white/20 text-neutral-900 dark:text-white shadow-xs scale-100'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              )}>
              <Icon sx={{ fontSize: 16 }} className="shrink-0 transition-transform duration-300" />
              <span>{t[LAYER_META[key].labelKey]}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
