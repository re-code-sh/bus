import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl';

export function flyToCoordinate(
  map: MapLibreMap | null,
  center: [number, number],
  options?: {
    zoom?: number;
    padding?: PaddingOptions;
    duration?: number;
  }
) {
  if (!map) return;
  map.flyTo({
    center,
    zoom: options?.zoom ?? 15,
    padding: options?.padding ?? { top: 60, bottom: 260, left: 20, right: 20 },
    duration: options?.duration ?? 1200,
    essential: true,
  });
}
