import type { FeatureCollection, Point, Feature } from 'geojson';
import type { TransitListItem } from '@/hooks/use-transit-search';
import type { BusStop } from '@/lib/bus-stops';

export const NESHAN_API_KEY =
  (import.meta.env.VITE_NESHAN_API_KEY as string) ||
  'service.47e9154a37aa4603b573e3a479d2822a';

export type NeshanItem = {
  title: string;
  address: string;
  neighbourhood?: string;
  region?: string;
  type: string;
  category: string;
  location: {
    x: number; // Longitude
    y: number; // Latitude
  };
};

export type NeshanSearchResponse = {
  count: number;
  items: NeshanItem[];
};

/** In-memory cache for nearby coordinates and search terms */
const nearbyCache = new Map<string, NeshanItem[]>();
const searchCache = new Map<string, NeshanItem[]>();

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

/**
 * Categorize a Neshan station item into metro, BRT, or bus.
 */
export function categorizeNeshanStation(item: NeshanItem): {
  kind: 'metro' | 'brt' | 'bus';
  color: string;
  lineName?: string;
} {
  const text = `${item.title} ${item.type} ${item.category}`.toLowerCase();

  if (text.includes('مترو') || text.includes('metro') || text.includes('قطار شهری')) {
    let color = '#3b82f6';
    if (text.includes('خط ۱') || text.includes('خط 1')) color = '#ef4444';
    else if (text.includes('خط ۲') || text.includes('خط 2')) color = '#0284c7';
    else if (text.includes('خط ۳') || text.includes('خط 3')) color = '#059669';
    else if (text.includes('خط ۴') || text.includes('خط 4')) color = '#eab308';
    else if (text.includes('خط ۵') || text.includes('خط 5')) color = '#10b981';
    else if (text.includes('خط ۶') || text.includes('خط 6')) color = '#ec4899';
    else if (text.includes('خط ۷') || text.includes('خط 7')) color = '#8b5cf6';

    return { kind: 'metro', color };
  }

  if (text.includes('brt') || text.includes('بی آر تی') || text.includes('تندرو')) {
    return { kind: 'brt', color: '#0d9488' };
  }

  return { kind: 'bus', color: '#64748b' };
}

/**
 * Fetch nearby transit stations from Neshan API given latitude & longitude.
 */
export async function fetchNearbyStationsNeshan(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<NeshanItem[]> {
  const cacheKey = getCacheKey(lat, lng);
  if (nearbyCache.has(cacheKey)) {
    return nearbyCache.get(cacheKey)!;
  }

  const url = `https://api.neshan.org/v1/search?term=${encodeURIComponent(
    'ایستگاه'
  )}&lat=${lat}&lng=${lng}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Api-Key': NESHAN_API_KEY,
      },
      signal,
    });

    if (!res.ok) {
      return [];
    }

    const data: NeshanSearchResponse = await res.json();
    const items = data.items || [];
    nearbyCache.set(cacheKey, items);
    return items;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return [];
    }
    console.warn('Neshan API nearby search failed:', err);
    return [];
  }
}

/**
 * Search transit stations from Neshan API given search term & coordinate.
 */
export async function searchTransitStationsNeshan(
  term: string,
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<NeshanItem[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const cacheKey = `${trimmed}_${getCacheKey(lat, lng)}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  const url = `https://api.neshan.org/v1/search?term=${encodeURIComponent(
    trimmed
  )}&lat=${lat}&lng=${lng}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Api-Key': NESHAN_API_KEY,
      },
      signal,
    });

    if (!res.ok) {
      return [];
    }

    const data: NeshanSearchResponse = await res.json();
    const items = data.items || [];
    searchCache.set(cacheKey, items);
    return items;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return [];
    }
    console.warn('Neshan API search failed:', err);
    return [];
  }
}

/**
 * Convert an array of Neshan items into a GeoJSON FeatureCollection<Point>
 * compatible with MapLibre GL station layers.
 */
export function neshanItemsToGeoJSON(items: NeshanItem[]): FeatureCollection<Point> {
  const features: Feature<Point>[] = items.map((item, index) => {
    const { kind, color } = categorizeNeshanStation(item);

    return {
      type: 'Feature',
      id: `neshan-${index}-${item.location.x.toFixed(5)}-${item.location.y.toFixed(5)}`,
      properties: {
        id: `neshan-${index}`,
        name_fa: item.title,
        name_en: item.title,
        lineColor: color,
        kind,
        address: item.address,
        isActive: true,
        isInterchange: false,
      },
      geometry: {
        type: 'Point',
        coordinates: [item.location.x, item.location.y],
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

export function makeNeshanBusStop(item: NeshanItem, index: number, isBRT: boolean): BusStop {
  return {
    id: `neshan-b-${index}`,
    name: item.title,
    latinName: item.title,
    address: item.address || '',
    coordinate: [item.location.x, item.location.y],
    lines: isBRT ? 'BRT' : 'Bus',
    isBRT,
    brtLine: isBRT ? 'BRT' : '',
    direction: '',
    stationCode: '',
    seat: '',
    shelter: '',
    light: '',
    disabledAccess: '',
    transportMode: isBRT ? 'BRT' : 'Bus',
    city: 'Tehran',
    dist: 0,
  };
}

/**
 * Convert Neshan items into TransitListItem structure for the station search sheet.
 */
export function neshanItemsToTransitList(items: NeshanItem[]): TransitListItem[] {
  return items.map((item, index): TransitListItem => {
    const { kind, color } = categorizeNeshanStation(item);

    if (kind === 'metro') {
      return {
        kind: 'metro',
        station: {
          id: `neshan-m-${index}`,
          name: { fa: item.title, en: item.title },
          city: 'Tehran',
          lineKey: 'metro',
          line: 'مترو',
          lineColor: color,
          lineColors: [color],
          coordinates: [item.location.x, item.location.y],
          isActive: true,
          dist: 0,
        },
      };
    }

    if (kind === 'brt') {
      return {
        kind: 'brt',
        stop: makeNeshanBusStop(item, index, true),
      };
    }

    return {
      kind: 'bus',
      stop: makeNeshanBusStop(item, index, false),
    };
  });
}
