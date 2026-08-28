import React from 'react';
import { useI18n } from '@/contexts/i18n-context';
import { useCity } from '@/contexts/city-context';
import type { TransitSection } from '@/hooks/use-transit-search';
import type { Station } from '@/lib/stations';
import type { BusStop } from '@/lib/bus-stops';
import { cityLabelFromName } from '@/lib/cities';
import { cn } from '@/lib/utils';

type StationListProps = {
  sections: TransitSection[];
  onSelectStation: (station: Station) => void;
  onSelectBusStop: (stop: BusStop, kind: 'brt' | 'bus') => void;
};

export function StationList({ sections, onSelectStation, onSelectBusStop }: StationListProps) {
  const { t, lang } = useI18n();
  const { cityId } = useCity();
  const targetCity = cityId.toLowerCase();

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 px-4 space-y-2">
        <p className="text-sm font-semibold text-white">{t.emptyListTitle}</p>
        <p className="text-xs text-neutral-400 leading-relaxed">{t.emptyListHint}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6 overflow-y-auto min-h-0 h-full">
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="space-y-1">
            <div className="sticky top-0 z-10 flex items-center gap-1.5 py-1.5 px-2 bg-[#181b20]/95 backdrop-blur-xs border-b border-white/10">
              <Icon sx={{ fontSize: 16 }} style={{ color: section.color }} />
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: section.color }}>
                {section.title}
              </span>
              <span className="text-[10px] text-neutral-400 mr-auto rtl:mr-0 rtl:ml-auto">
                ({section.data.length})
              </span>
            </div>

            <div className="space-y-0.5 pt-1">
              {section.data.map((item) => {
                if (item.kind === 'metro') {
                  const s = item.station;
                  const isCurrentCity = s.city.toLowerCase() === targetCity;
                  return (
                    <button
                      key={`m-${s.id}`}
                      type="button"
                      onClick={() => onSelectStation(s)}
                      className={cn(
                        'w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors text-start cursor-pointer',
                        isCurrentCity
                          ? 'bg-white/6 hover:bg-white/10'
                          : 'hover:bg-white/5 opacity-85'
                      )}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className={cn('size-2.5 rounded-full shrink-0', !s.isActive && 'opacity-50')}
                          style={{ backgroundColor: s.lineColor }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs sm:text-sm font-semibold text-white truncate">
                              {s.name[lang]}
                            </p>
                            {isCurrentCity && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 font-medium">
                                {cityLabelFromName(s.city, lang)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate">{s.line}</p>
                        </div>
                      </div>
                      {!isCurrentCity && (
                        <span className="text-[10px] text-neutral-400 shrink-0 pr-2 rtl:pr-0 rtl:pl-2">
                          {cityLabelFromName(s.city, lang)}
                        </span>
                      )}
                    </button>
                  );
                }

                const stop = item.stop;
                const isBRT = item.kind === 'brt';
                const displayName = lang === 'fa' || !stop.latinName ? stop.name : stop.latinName;
                const isCurrentCity = stop.city.toLowerCase() === targetCity;
                return (
                  <button
                    key={`${item.kind}-${stop.id}`}
                    type="button"
                    onClick={() => onSelectBusStop(stop, item.kind)}
                    className={cn(
                      'w-full flex items-center justify-between p-2.5 rounded-2xl transition-colors text-start cursor-pointer',
                      isCurrentCity
                        ? 'bg-white/6 hover:bg-white/10'
                        : 'hover:bg-white/5 opacity-85'
                    )}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={cn(
                          'size-2.5 shrink-0',
                          isBRT ? 'rounded-xs bg-[#0d9488]' : 'rounded-full bg-[#64748b]'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {isBRT ? stop.brtLine || t.brtStops : stop.lines || t.busStops}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-400 shrink-0 pr-2 rtl:pr-0 rtl:pl-2">
                      {cityLabelFromName(stop.city, lang)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
