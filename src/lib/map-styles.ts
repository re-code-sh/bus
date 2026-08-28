import type { StyleSpecification } from 'maplibre-gl';

export const CARTO_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
} as const;

export const ESRI_ATTRIBUTION =
  '© Esri, Maxar, Earthstar Geographics, and the GIS User Community';

/** Esri World Imagery — raster satellite tiles with full glyphs support. */
export const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  name: 'Esri World Imagery',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'esri-world-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: ESRI_ATTRIBUTION,
    },
  },
  layers: [
    {
      id: 'esri-world-imagery-layer',
      type: 'raster',
      source: 'esri-world-imagery',
    },
  ],
};

export type BasemapId = 'street' | 'satellite';
export type MapTheme = 'light' | 'dark';

export function resolveMapStyle(
  basemap: BasemapId,
  theme: MapTheme
): string | StyleSpecification {
  if (basemap === 'satellite') {
    // Return a fresh, pristine clone to prevent MapLibre internal object mutation bugs across switches
    return JSON.parse(JSON.stringify(SATELLITE_STYLE));
  }
  return theme === 'dark' ? CARTO_STYLES.dark : CARTO_STYLES.light;
}

export function transformMapStyle(style: StyleSpecification): StyleSpecification {
  if (!style || !style.layers) return style;
  return {
    ...style,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    layers: style.layers.map((layer) => {
      if (layer.type === 'symbol' && layer.layout) {
        return {
          ...layer,
          layout: {
            ...layer.layout,
            'text-font': ['Noto Sans Regular'],
            'text-letter-spacing': 0,
          },
        };
      }
      return layer;
    }),
  };
}
