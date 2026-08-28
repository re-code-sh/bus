import React from 'react';
import TrainRoundedIcon from '@mui/icons-material/TrainRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { useI18n } from '@/contexts/i18n-context';
import type { Station } from '@/lib/stations';
import type { BusStop } from '@/lib/bus-stops';
import type { PlaceResult } from '@/lib/geocoding';
import { cityLabelFromName } from '@/lib/cities';
import type { TransitSection } from '@/hooks/use-transit-search';
import { cn } from '@/lib/utils';

type SearchColumnsProps = {
  sections: TransitSection[];
  isTransitSearching: boolean;
  places: PlaceResult[];
  isPlaceSearching: boolean;
  query: string;
  onSelectStation: (station: Station) => void;
  onSelectBusStop: (stop: BusStop, kind: 'brt' | 'bus') => void;
  onSelectPlace: (place: PlaceResult) => void;
};

export function SearchColumns({
  sections,
  isTransitSearching,
  places,
  isPlaceSearching,
  query,
  onSelectStation,
  onSelectBusStop,
  onSelectPlace,
}: SearchColumnsProps) {
  const { t, lang } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-3 h-full min-h-0 divide-x divide-white/10 rtl:divide-x-reverse">
      {/* ── Transit Stations Column ── */}
      <div className="flex flex-col min-h-0 overflow-hidden pr-2 rtl:pr-0 rtl:pl-2">
        <div className="flex items-center gap-1.5 pb-2 mb-1 border-b border-white/10 text-[#60a5fa]">
          <TrainRoundedIcon sx={{ fontSize: 16 }} />
          <span className="text-[11px] font-bold uppercase tracking-wider">{t.transitColumn}</span>
          {isTransitSearching && <span className="size-2 rounded-full bg-blue-400 animate-ping ml-auto rtl:ml-0 rtl:mr-auto" />}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-6">
          {sections.length === 0 ? (
            <div className="text-center py-6 text-xs text-neutral-400">
              {isTransitSearching ? t.searching : t.noResults}
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div
                  className="text-[10px] font-bold uppercase tracking-wide opacity-70 px-1"
                  style={{ color: section.color }}>
                  {section.title}
                </div>
                {section.data.map((item) => {
                  if (item.kind === 'metro') {
                    return (
                      <button
                        key={`m-${item.station.id}`}
                        type="button"
                        onClick={() => onSelectStation(item.station)}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-start hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.station.lineColor }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate">
                            {item.station.name[lang]}
                          </p>
                          <p className="text-[10px] text-neutral-400 truncate">
                            {item.station.line} • {cityLabelFromName(item.station.city, lang)}
                          </p>
                        </div>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={`${item.kind}-${item.stop.id}`}
                      type="button"
                      onClick={() => onSelectBusStop(item.stop, item.kind)}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-start hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer">
                      <span
                        className={cn(
                          'size-2 shrink-0',
                          item.kind === 'brt' ? 'rounded-xs bg-[#0d9488]' : 'rounded-full bg-[#64748b]'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {lang === 'fa' || !item.stop.latinName ? item.stop.name : item.stop.latinName}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">
                          {item.kind === 'brt' ? item.stop.brtLine || t.brtStops : item.stop.lines || t.busStops}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Places Column (Nominatim) ── */}
      <div className="flex flex-col min-h-0 overflow-hidden pl-2 rtl:pl-0 rtl:pr-2">
        <div className="flex items-center gap-1.5 pb-2 mb-1 border-b border-white/10 text-[#a78bfa]">
          <PlaceRoundedIcon sx={{ fontSize: 16 }} />
          <span className="text-[11px] font-bold uppercase tracking-wider">{t.places}</span>
          {isPlaceSearching && <span className="size-2 rounded-full bg-purple-400 animate-ping ml-auto rtl:ml-0 rtl:mr-auto" />}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pb-6">
          {query.length < 2 ? (
            <div className="text-center py-6 text-xs text-neutral-400">{t.placeSearchHint}</div>
          ) : isPlaceSearching ? (
            <div className="space-y-2 py-2">
              <div className="h-9 rounded-xl bg-white/5 animate-pulse" />
              <div className="h-9 rounded-xl bg-white/5 animate-pulse" />
              <div className="h-9 rounded-xl bg-white/5 animate-pulse" />
            </div>
          ) : places.length === 0 ? (
            <div className="text-center py-6 text-xs text-neutral-400">{t.noPlacesFound}</div>
          ) : (
            places.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => onSelectPlace(place)}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-start hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer">
                <span className="size-2 rounded-xs bg-[#a78bfa] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{place.name}</p>
                  <p className="text-[10px] text-neutral-400 truncate">
                    {place.displayName.split(',').slice(1, 3).join(', ') || place.cityName}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
