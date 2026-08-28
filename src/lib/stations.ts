import { stations as rawStations } from '@/assets/data/metroStations';
import { lineColors as LINE_COLORS, lineNames as LINE_NAMES } from '@/assets/data/metroLines';
import type { FeatureCollection, Feature, Point, LineString } from 'geojson';

export const CITY_CENTERS: Record<string, [number, number]> = {
  tehran: [51.3890, 35.6892],
  isfahan: [51.6660, 32.6546],
  mashhad: [59.6067, 36.2972],
  tabriz: [46.2919, 38.0800],
  karaj: [50.9915, 35.8327],
  shiraz: [52.5836, 29.5918],
};

export function calcDistanceKm(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const dx = (lng1 - lng2) * 88 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  const dy = (lat1 - lat2) * 111;
  return Math.sqrt(dx * dx + dy * dy);
}

export interface RawStation {
  ID: string;
  City: string;
  "Line(s)": string;
  "Name English": string;
  "Name Persian": string;
  Longitude: string;
  Latitude: string;
  "Is Active": string;
  Previous: string;
  Next: string;
}

export type Station = {
  id: string;
  name: { en: string; fa: string };
  city: string;
  lineKey: string;
  line: string;
  lineColor: string;
  lineColors: string[];
  coordinates: [number, number]; // [lng, lat]
  isActive: boolean;
  dist: number;
};

function mapRawStation(s: RawStation): Station {
  const lineKey = s['Line(s)'];
  const keys = lineKey.split(',').map((k) => k.trim());
  const primary = keys[0];
  const lng = parseFloat(s.Longitude);
  const lat = parseFloat(s.Latitude);
  const center = CITY_CENTERS[s.City.toLowerCase()] ?? [51.3890, 35.6892];
  const dist = Math.round(calcDistanceKm(lng, lat, center[0], center[1]) * 10) / 10;

  return {
    id: s.ID,
    name: { en: s['Name English'], fa: s['Name Persian'] },
    city: s.City,
    lineKey,
    line: (LINE_NAMES as Record<string, string>)[primary] ?? `Line ${primary}`,
    lineColor: (LINE_COLORS as Record<string, string>)[primary] ?? '#888888',
    lineColors: keys.map((k) => (LINE_COLORS as Record<string, string>)[k] ?? '#888888'),
    coordinates: [lng, lat],
    isActive: s['Is Active'] === 'T',
    dist,
  };
}

export const STATIONS: Station[] = (rawStations as RawStation[]).map(mapRawStation);
export const STATIONS_BY_ID = new Map<string, Station>(STATIONS.map((s) => [s.id, s]));

/**
 * Filter stations by search query, placing stations from `activeCityId` first.
 */
export function filterStationsByQuery(query: string, activeCityId?: string): Station[] {
  const q = query.trim().toLowerCase();
  const matched = STATIONS.filter((s) => {
    if (!q) return true;
    return (
      s.name.en.toLowerCase().includes(q) ||
      s.name.fa.includes(query) ||
      s.line.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q)
    );
  });

  if (!activeCityId) return matched;

  const targetCity = activeCityId.toLowerCase();

  // Stable sort: Stations belonging to the active city come first
  return [...matched].sort((a, b) => {
    const aIsCurrentCity = a.city.toLowerCase() === targetCity;
    const bIsCurrentCity = b.city.toLowerCase() === targetCity;

    if (aIsCurrentCity && !bIsCurrentCity) return -1;
    if (!aIsCurrentCity && bIsCurrentCity) return 1;
    return 0;
  });
}

export function buildMetroNetworkGeoJSON(active: RawStation[]): FeatureCollection<LineString> {
  const byId = new Map(active.map((s) => [s.ID, s]));
  const seen = new Set<string>();

  const features: Feature<LineString, { lineKey: string; color: string; dist: number }>[] = [];

  for (const station of active) {
    const nextIds = station.Next.split(',')
      .map((n) => n.trim())
      .filter((n) => n !== '-1' && n !== '');

    for (const nextId of nextIds) {
      const next = byId.get(nextId);
      if (!next) continue;

      const edgeKey = [station.ID, nextId].sort().join('|');
      if (seen.has(edgeKey)) continue;
      seen.add(edgeKey);

      const aLines = station['Line(s)'].split(',').map((l) => l.trim());
      const bLines = next['Line(s)'].split(',').map((l) => l.trim());
      const sharedLine = aLines.find((l) => bLines.includes(l)) ?? aLines[0];

      const sLng = parseFloat(station.Longitude);
      const sLat = parseFloat(station.Latitude);
      const nLng = parseFloat(next.Longitude);
      const nLat = parseFloat(next.Latitude);
      const midLng = (sLng + nLng) / 2;
      const midLat = (sLat + nLat) / 2;
      const center = CITY_CENTERS[station.City.toLowerCase()] ?? [51.3890, 35.6892];
      const dist = Math.round(calcDistanceKm(midLng, midLat, center[0], center[1]) * 10) / 10;

      features.push({
        type: 'Feature',
        properties: {
          lineKey: sharedLine,
          color: (LINE_COLORS as Record<string, string>)[sharedLine] ?? '#888888',
          dist,
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [sLng, sLat],
            [nLng, nLat],
          ],
        },
      });
    }
  }

  return { type: 'FeatureCollection', features };
}

export const METRO_NETWORK_GEOJSON = buildMetroNetworkGeoJSON(rawStations as RawStation[]);

export function toGeoJSON(stations: Station[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: stations.map((s) => ({
      type: 'Feature',
      properties: {
        id: s.id,
        nameEn: s.name.en,
        nameFa: s.name.fa,
        city: s.city,
        line: s.line,
        lineColor: s.lineColor,
        lineColor2: s.lineColors[1] ?? s.lineColor,
        isInterchange: s.lineColors.length > 1,
        isActive: s.isActive,
        dist: s.dist,
      },
      geometry: {
        type: 'Point',
        coordinates: s.coordinates,
      },
    })),
  };
}

export const STATIONS_GEOJSON = toGeoJSON(STATIONS);
