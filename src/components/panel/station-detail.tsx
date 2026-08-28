import React, { useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useI18n } from '@/contexts/i18n-context';
import { useStations, type MapSelection } from '@/contexts/stations-context';
import { openBusArrivalUssd } from '@/lib/bus-arrival';
import { openMapsDirections } from '@/lib/maps';
import { formatBusFacilityValue } from '@/lib/bus-stops';
import { cn } from '@/lib/utils';

type StationDetailProps = {
  selected: MapSelection;
  onBackToList: () => void;
};

export function StationDetail({ selected, onBackToList }: StationDetailProps) {
  const { t, lang, isRTL } = useI18n();
  const {
    route,
    routeDistance,
    routeDuration,
    routeLoading,
    userLocation,
    fetchRoute,
    clearRoute,
  } = useStations();

  const [copiedUssd, setCopiedUssd] = useState(false);

  const handleOpenMaps = () => {
    if (selected.kind === 'metro') {
      const [lng, lat] = selected.station.coordinates;
      openMapsDirections(lat, lng, selected.station.name[lang]);
    } else if (selected.kind === 'place') {
      const [lng, lat] = selected.place.coordinate;
      openMapsDirections(lat, lng, selected.place.name);
    } else {
      const [lng, lat] = selected.stop.coordinate;
      const name = lang === 'fa' || !selected.stop.latinName ? selected.stop.name : selected.stop.latinName;
      openMapsDirections(lat, lng, name);
    }
  };

  const handleBusArrival = async (stationCode: string) => {
    const success = await openBusArrivalUssd(stationCode);
    if (success) {
      setCopiedUssd(true);
      setTimeout(() => setCopiedUssd(false), 2500);
    }
  };

  const renderContent = () => {
    if (selected.kind === 'metro') {
      const s = selected.station;
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className="size-4 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: s.lineColor }}
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                {s.name[lang]}
              </h2>
              <p className="text-xs text-neutral-400">{s.line}</p>
            </div>
          </div>
          {s.lineColors.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-neutral-400">اتصال به خطوط:</span>
              {s.lineColors.map((color, idx) => (
                <span
                  key={idx}
                  className="size-3 rounded-full border border-white/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (selected.kind === 'brt' || selected.kind === 'bus') {
      const stop = selected.stop;
      const isBRT = selected.kind === 'brt';
      const displayName = lang === 'fa' || !stop.latinName ? stop.name : stop.latinName;
      const transportMode = formatBusFacilityValue(stop.transportMode, lang, t);

      const amenities = [
        { label: t.seat, val: formatBusFacilityValue(stop.seat, lang, t) },
        { label: t.shelter, val: formatBusFacilityValue(stop.shelter, lang, t) },
        { label: t.light, val: formatBusFacilityValue(stop.light, lang, t) },
        { label: t.disabledAccess, val: formatBusFacilityValue(stop.disabledAccess, lang, t) },
      ].filter((a) => !!a.val);

      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'size-4 shrink-0 shadow-xs',
                isBRT ? 'rounded-xs bg-[#0d9488]' : 'rounded-full bg-[#64748b]'
              )}
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                {displayName}
              </h2>
              <p className="text-xs text-neutral-400">
                {isBRT ? stop.brtLine || t.brtStops : t.busStops}
              </p>
            </div>
          </div>

          {/* USSD Arrival Button */}
          {stop.stationCode.trim() && (
            <button
              type="button"
              onClick={() => handleBusArrival(stop.stationCode)}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-semibold text-xs transition-all cursor-pointer select-none active:scale-98',
                isBRT
                  ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                  : 'bg-slate-500/25 text-slate-300 hover:bg-slate-500/35'
              )}>
              {copiedUssd ? (
                <>
                  <CheckRoundedIcon sx={{ fontSize: 18 }} className="text-emerald-400" />
                  <span>{t.copiedToClipboard}</span>
                </>
              ) : (
                <>
                  <CallRoundedIcon sx={{ fontSize: 18 }} />
                  <span>{isBRT ? t.nextArrivalBrt : t.nextArrivalBus}</span>
                </>
              )}
            </button>
          )}

          {/* Amenities Badges */}
          {amenities.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
                {t.amenities}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {amenities.map((item) => (
                  <div key={item.label} className="bg-white/5 rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] text-neutral-400 block">{item.label}</span>
                    <span className="text-xs font-medium text-white">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Table */}
          <div className="bg-white/5 rounded-2xl p-3 space-y-2 text-xs">
            {stop.lines && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">{t.busLines}</span>
                <span className="font-semibold text-white">{stop.lines}</span>
              </div>
            )}
            {stop.direction && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">{t.direction}</span>
                <span className="font-medium text-white">{stop.direction}</span>
              </div>
            )}
            {stop.stationCode && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">{t.stationCode}</span>
                <span className="font-mono text-white">{stop.stationCode}</span>
              </div>
            )}
            {transportMode && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">{t.transportMode}</span>
                <span className="font-medium text-white">{transportMode}</span>
              </div>
            )}
            {stop.address && (
              <div className="pt-1 border-t border-white/10 text-neutral-300 text-[11px] leading-relaxed">
                {stop.address}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (selected.kind === 'place') {
      const place = selected.place;
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="size-4 rounded-xs bg-[#a78bfa] shrink-0 shadow-xs" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                {place.name}
              </h2>
              <p className="text-xs text-neutral-400">{place.cityName || t.layerPlace}</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-xs text-neutral-300 leading-relaxed">
            {place.displayName}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Action Toolbar */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onBackToList}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer">
          <ArrowBackRoundedIcon sx={{ fontSize: 16 }} className={cn(isRTL && 'rotate-180')} />
          <span>{t.backToList}</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          {route ? (
            <button
              type="button"
              onClick={clearRoute}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold transition-all cursor-pointer active:scale-98">
              <CancelRoundedIcon sx={{ fontSize: 18 }} />
              <span>{t.clearRoute}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={routeLoading || !userLocation}
              onClick={fetchRoute}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer select-none active:scale-98',
                userLocation
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  : 'bg-white/10 text-neutral-400 cursor-not-allowed'
              )}>
              <DirectionsCarRoundedIcon sx={{ fontSize: 18 }} />
              <span>{routeLoading ? t.searching : t.driveThere}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenMaps}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer active:scale-98">
            <LaunchRoundedIcon sx={{ fontSize: 18 }} />
            <span>{t.openInMaps}</span>
          </button>
        </div>

        {!userLocation && !route && (
          <p className="text-[10px] text-center text-neutral-400">{t.locateYourselfFirst}</p>
        )}

        {/* Route Stats Bar */}
        {route && routeDistance !== null && routeDuration !== null && (
          <div className="flex items-center justify-around bg-blue-500/15 border border-blue-500/20 rounded-2xl py-2 px-3 text-center">
            <div>
              <span className="text-[10px] text-blue-300/80 block">{t.distance}</span>
              <span className="text-sm font-bold text-blue-200">
                {routeDistance.toFixed(1)} {t.km}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-blue-500/30" />
            <div>
              <span className="text-[10px] text-blue-300/80 block">{t.duration}</span>
              <span className="text-sm font-bold text-blue-200">
                {Math.round(routeDuration)} {t.min}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Details */}
      {renderContent()}
    </div>
  );
}
