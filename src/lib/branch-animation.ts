import type { FeatureCollection, LineString, Point, Feature } from 'geojson';
import { METRO_NETWORK_GEOJSON, STATIONS_GEOJSON, CITY_CENTERS } from './stations';
import { TEHRAN_BRT_LINES_GEOJSON } from './brt-lines';
import { BRT_STOPS_GEOJSON } from './bus-stops';

/**
 * Returns a subset of metro line features and interpolated line lengths
 * expanding outward from the city center based on progress (0 -> 1).
 */
export function getAnimatedMetroBranches(
  progress: number,
  cityId = 'tehran'
): FeatureCollection<LineString> {
  if (progress >= 1) return METRO_NETWORK_GEOJSON;
  if (progress <= 0) return { type: 'FeatureCollection', features: [] };

  const center = CITY_CENTERS[cityId.toLowerCase()] ?? [51.389, 35.6892];
  const maxAllowedDist = progress * 45; // Max 45km radius

  const features = METRO_NETWORK_GEOJSON.features.filter((f) => {
    const dist = (f.properties?.dist as number) ?? 0;
    return dist <= maxAllowedDist;
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Returns a subset of metro stations expanding outward based on progress.
 */
export function getAnimatedMetroStations(
  progress: number,
  cityId = 'tehran'
): FeatureCollection<Point> {
  if (progress >= 1) return STATIONS_GEOJSON;
  if (progress <= 0) return { type: 'FeatureCollection', features: [] };

  const maxAllowedDist = progress * 45;

  const features = STATIONS_GEOJSON.features.filter((f) => {
    const dist = (f.properties?.dist as number) ?? 0;
    return dist <= maxAllowedDist;
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Returns a subset of BRT lines expanding outward from Tehran center.
 */
export function getAnimatedBrtBranches(progress: number): FeatureCollection<LineString> {
  if (progress >= 1) return TEHRAN_BRT_LINES_GEOJSON;
  if (progress <= 0) return { type: 'FeatureCollection', features: [] };

  const maxAllowedDist = progress * 32;

  const features = TEHRAN_BRT_LINES_GEOJSON.features.filter((f) => {
    const dist = (f.properties?.dist as number) ?? 0;
    return dist <= maxAllowedDist;
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Returns a subset of BRT stops expanding outward from Tehran center.
 */
export function getAnimatedBrtStops(progress: number): FeatureCollection<Point> {
  if (progress >= 1) return BRT_STOPS_GEOJSON;
  if (progress <= 0) return { type: 'FeatureCollection', features: [] };

  const maxAllowedDist = progress * 32;

  const features = BRT_STOPS_GEOJSON.features.filter((f) => {
    const dist = (f.properties?.dist as number) ?? 0;
    return dist <= maxAllowedDist;
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}
