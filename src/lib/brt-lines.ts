import rawBrtLines from '@/assets/data/tehranBRTLines.json';
import type { FeatureCollection, LineString } from 'geojson';
import { calcDistanceKm } from './stations';

const BRT_COLORS: Record<string, string> = {
  '1': '#ef4444',
  '2': '#a855f7',
  '3': '#2563eb',
  '4': '#22c55e',
  '5': '#ec4899',
  '6': '#eab308',
  '7': '#14b8a6',
  '8': '#f97316',
  '9': '#6366f1',
  '10': '#84cc16',
};

function brtColor(name: string) {
  const line = name.match(/BRT\s*(\d+)/i)?.[1];
  return (line && BRT_COLORS[line]) || '#f97316';
}

const TEHRAN_CENTER: [number, number] = [51.3890, 35.6892];

export const TEHRAN_BRT_LINES_GEOJSON: FeatureCollection<LineString> = {
  type: 'FeatureCollection',
  features: (rawBrtLines.features as unknown as Array<{
    geometry: { type: string; coordinates: [number, number][] };
    properties: Record<string, unknown>;
  }>)
    .filter((f) => f.geometry.type === 'LineString')
    .map((f) => {
      const coords = f.geometry.coordinates;
      let minDistance = 999;
      for (const [lng, lat] of coords) {
        const d = calcDistanceKm(lng, lat, TEHRAN_CENTER[0], TEHRAN_CENTER[1]);
        if (d < minDistance) minDistance = d;
      }
      return {
        type: 'Feature',
        properties: {
          ...f.properties,
          color: brtColor(String(f.properties?.Name ?? '')),
          dist: Math.round(minDistance * 10) / 10,
        },
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
      };
    }),
};
