import { useState, useEffect, useMemo, type ElementType } from 'react';
import TrainRoundedIcon from '@mui/icons-material/TrainRounded';
import DirectionsBusRoundedIcon from '@mui/icons-material/DirectionsBusRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import { listBrtStops, searchBusStops, type BusStop } from '@/lib/bus-stops';
import type { LayerKey } from '@/contexts/map-layers-context';
import type { Lang, Strings } from '@/lib/i18n';
import { STATIONS, type Station } from '@/lib/stations';
import { CITIES, CITY_IDS, type CityId } from '@/lib/cities';
import { searchTransitStationsNeshan, neshanItemsToTransitList } from '@/lib/neshan';
import { useDebouncedValue } from './use-debounced-value';

export const TRANSIT_SEARCH_DEBOUNCE_MS = 200;

export type TransitListItem =
  | { kind: 'metro'; station: Station }
  | { kind: 'brt'; stop: BusStop }
  | { kind: 'bus'; stop: BusStop };

export type TransitSection = {
  title: string;
  cityName: string;
  cityId: CityId;
  icon: ElementType;
  color: string;
  data: TransitListItem[];
};

function matchesStationQuery(station: Station, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  return (
    station.name.en.toLowerCase().includes(q) ||
    station.name.fa.includes(query) ||
    station.line.toLowerCase().includes(q)
  );
}

export function buildTransitSections(
  query: string,
  isSheetVisible: (key: LayerKey) => boolean,
  t: Strings,
  activeCityId: CityId = 'tehran',
  lang: Lang = 'fa'
): TransitSection[] {
  const orderedCityIds: CityId[] = [
    activeCityId,
    ...CITY_IDS.filter((cid) => cid !== activeCityId),
  ];

  const sections: TransitSection[] = [];

  for (const cid of orderedCityIds) {
    const cityConfig = CITIES[cid];
    const cityName = cityConfig.name[lang];
    const targetCityLower = cid.toLowerCase();

    // 1. Metro Stations for this city
    if (isSheetVisible('metro')) {
      const cityMetro = STATIONS.filter(
        (s) => s.city.toLowerCase() === targetCityLower && matchesStationQuery(s, query)
      );

      if (cityMetro.length > 0) {
        sections.push({
          title: lang === 'fa' ? `ایستگاه‌های مترو ${cityName}` : `${cityName} Metro Stations`,
          cityName,
          cityId: cid,
          icon: TrainRoundedIcon,
          color: '#60a5fa',
          data: cityMetro.map((s) => ({ kind: 'metro', station: s })),
        });
      }
    }

    // 2. BRT Stops for this city (Tehran & Mashhad)
    if ((cid === 'tehran' || cid === 'mashhad') && isSheetVisible('brt')) {
      const brtStops = listBrtStops(cid, query);
      if (brtStops.length > 0) {
        sections.push({
          title: lang === 'fa' ? `ایستگاه‌های BRT ${cityName}` : `${cityName} BRT Stops`,
          cityName,
          cityId: cid,
          icon: DirectionsBusRoundedIcon,
          color: '#fb923c',
          data: brtStops.map((s) => ({ kind: 'brt', stop: s })),
        });
      }
    }

    // 3. Regular Bus Stops for this city
    if (isSheetVisible('bus') && query.length >= 2) {
      const busResults = searchBusStops(query, cid);
      if (busResults.bus.length > 0) {
        sections.push({
          title: lang === 'fa' ? `ایستگاه‌های اتوبوس ${cityName}` : `${cityName} Bus Stops`,
          cityName,
          cityId: cid,
          icon: DirectionsBusRoundedIcon,
          color: '#94a3b8',
          data: busResults.bus.map((s) => ({ kind: 'bus', stop: s })),
        });
      }
    }
  }

  return sections;
}

type UseTransitSearchResult = {
  sections: TransitSection[];
  isSearching: boolean;
};

export function useTransitSearch(
  query: string,
  isSheetVisible: (key: LayerKey) => boolean,
  t: Strings,
  activeCityId: CityId = 'tehran',
  lang: Lang = 'fa'
): UseTransitSearchResult {
  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed, TRANSIT_SEARCH_DEBOUNCE_MS);
  const [onlineResults, setOnlineResults] = useState<TransitListItem[]>([]);
  const [isOnlineSearching, setIsOnlineSearching] = useState(false);

  const settled = trimmed.length === 0 || debouncedQuery === trimmed;
  const isSearching = (trimmed.length > 0 && !settled) || isOnlineSearching;

  const localSections = useMemo(
    () =>
      settled
        ? buildTransitSections(debouncedQuery, isSheetVisible, t, activeCityId, lang)
        : [],
    [settled, debouncedQuery, isSheetVisible, t, activeCityId, lang]
  );

  // Fetch live online transit stations from Neshan API
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setOnlineResults([]);
      setIsOnlineSearching(false);
      return;
    }

    const controller = new AbortController();
    const cityCenter = CITIES[activeCityId]?.center ?? [51.389, 35.6892];
    const [lng, lat] = cityCenter;

    setIsOnlineSearching(true);
    searchTransitStationsNeshan(debouncedQuery, lat, lng, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setOnlineResults(neshanItemsToTransitList(items));
          setIsOnlineSearching(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setIsOnlineSearching(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, activeCityId]);

  const sections = useMemo(() => {
    if (onlineResults.length === 0) return localSections;

    const onlineSection: TransitSection = {
      title: lang === 'fa' ? 'ایستگاه‌های آنلاین (نشان)' : 'Neshan Online Stations',
      cityName: CITIES[activeCityId].name[lang],
      cityId: activeCityId,
      icon: TravelExploreRoundedIcon,
      color: '#a78bfa',
      data: onlineResults,
    };

    return [...localSections, onlineSection];
  }, [localSections, onlineResults, activeCityId, lang]);

  return { sections, isSearching };
}
