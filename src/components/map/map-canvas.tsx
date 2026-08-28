import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { useBasemap } from '@/contexts/basemap-context';
import { useCity } from '@/contexts/city-context';
import { useMapLayers } from '@/contexts/map-layers-context';
import { useStations, selectionCoordinates } from '@/contexts/stations-context';
import { useTheme } from '@/contexts/theme-context';
import { CARTO_STYLES, ESRI_ATTRIBUTION } from '@/lib/map-styles';
import { METRO_NETWORK_GEOJSON, STATIONS_GEOJSON, STATIONS_BY_ID } from '@/lib/stations';
import { TEHRAN_BRT_LINES_GEOJSON } from '@/lib/brt-lines';
import { MapControls } from './map-controls';
import { useGeolocation } from '@/hooks/use-geolocation';

// Layer and Source Constants
const SATELLITE_RASTER_SOURCE = 'esri-satellite-source';
const SATELLITE_RASTER_LAYER = 'esri-satellite-layer';

const METRO_NETWORK_SOURCE = 'metro-network';
const METRO_LINES_LAYER = 'metro-lines-layer';

const BRT_LINES_SOURCE = 'brt-lines';
const BRT_LINES_LAYER = 'brt-lines-layer';

const OSM_BUS_STATIONS_SOURCE = 'bus-stations-osm';
const OSM_BUS_STOPS_LAYER = 'bus-stops-layer';

const METRO_STATIONS_SOURCE = 'metro-stations';
const METRO_STATIONS_LAYER = 'metro-stations-layer';

const ROUTE_LINE_SOURCE = 'route-line';
const ROUTE_LINE_LAYER = 'route-line-layer';

export function MapCanvas() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectedMarkerRef = useRef<Marker | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const selectItemRef = useRef<typeof selectItem | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [bearing, setBearing] = useState(0);

  const { basemap } = useBasemap();
  const { theme } = useTheme();
  const { city, cityId } = useCity();
  const { isVisible } = useMapLayers();
  const {
    selected,
    route,
    selectItem,
    userLocation,
    setUserLocation,
    pendingFlyTo,
    clearPendingFlyTo,
  } = useStations();

  const { coords: geoCoords, loading: geoLoading, requestPosition } = useGeolocation();

  useEffect(() => {
    selectItemRef.current = selectItem;
  }, [selectItem]);

  // Sync geolocation to stations context
  useEffect(() => {
    if (geoCoords) {
      setUserLocation(geoCoords);
    }
  }, [geoCoords, setUserLocation]);

  // Setup Definitive Hybrid Sources and Layers in Exact Stacking Order:
  // (Bottom) Carto Vector Base -> Satellite Imagery Raster -> Metro Lines -> BRT Lines -> Bus Stops -> Metro Stations [Top]
  const setupSourcesAndLayers = useCallback(
    (map: MapLibreMap) => {
      if (!map.isStyleLoaded()) return;

      const metroOn = isVisible('metro');
      const brtOn = isVisible('brt');
      const busOn = isVisible('bus');
      const isSat = basemap === 'satellite';
      const busActive = busOn || brtOn;

      // ----------------------------------------------------
      // 1. (BOTTOM-MOST OVERLAY) Satellite Imagery Raster Layer
      // ----------------------------------------------------
      if (!map.getSource(SATELLITE_RASTER_SOURCE)) {
        map.addSource(SATELLITE_RASTER_SOURCE, {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: ESRI_ATTRIBUTION,
        });
      }
      if (!map.getLayer(SATELLITE_RASTER_LAYER)) {
        map.addLayer({
          id: SATELLITE_RASTER_LAYER,
          type: 'raster',
          source: SATELLITE_RASTER_SOURCE,
          layout: {
            visibility: isSat ? 'visible' : 'none',
          },
          paint: {
            'raster-opacity': isSat ? 1 : 0,
            'raster-opacity-transition': { duration: 300, delay: 0 },
          },
        });
      }

      // ----------------------------------------------------
      // 2. Legacy Metro Connecting Lines (Drawn directly on top of satellite/street)
      // ----------------------------------------------------
      if (!map.getSource(METRO_NETWORK_SOURCE)) {
        map.addSource(METRO_NETWORK_SOURCE, {
          type: 'geojson',
          data: METRO_NETWORK_GEOJSON,
        });
      }
      if (!map.getLayer(METRO_LINES_LAYER)) {
        map.addLayer({
          id: METRO_LINES_LAYER,
          type: 'line',
          source: METRO_NETWORK_SOURCE,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: 'visible',
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': metroOn ? 3.5 : 0.5,
            'line-opacity': metroOn ? 0.85 : 0,
            'line-opacity-transition': { duration: 350, delay: 0 },
            'line-width-transition': { duration: 350, delay: 0 },
          },
        });
      }

      // ----------------------------------------------------
      // 3. BRT Connecting Lines
      // ----------------------------------------------------
      if (!map.getSource(BRT_LINES_SOURCE)) {
        map.addSource(BRT_LINES_SOURCE, {
          type: 'geojson',
          data: TEHRAN_BRT_LINES_GEOJSON,
        });
      }
      if (!map.getLayer(BRT_LINES_LAYER)) {
        map.addLayer({
          id: BRT_LINES_LAYER,
          type: 'line',
          source: BRT_LINES_SOURCE,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: 'visible',
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': brtOn ? 3 : 0.5,
            'line-opacity': brtOn ? 0.9 : 0,
            'line-opacity-transition': { duration: 350, delay: 0 },
            'line-width-transition': { duration: 350, delay: 0 },
          },
        });
      }

      // ----------------------------------------------------
      // 4. Active OSRM Route Line
      // ----------------------------------------------------
      if (!map.getSource(ROUTE_LINE_SOURCE)) {
        map.addSource(ROUTE_LINE_SOURCE, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });
      }
      if (!map.getLayer(ROUTE_LINE_LAYER)) {
        map.addLayer({
          id: ROUTE_LINE_LAYER,
          type: 'line',
          source: ROUTE_LINE_SOURCE,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.9,
          },
        });
      }

      // ----------------------------------------------------
      // 5. Bus Stops (Smooth Scaling & Fade Transitions)
      // ----------------------------------------------------
      if (!map.getSource(OSM_BUS_STATIONS_SOURCE)) {
        map.addSource(OSM_BUS_STATIONS_SOURCE, {
          type: 'geojson',
          data: `/data/${cityId}-bus.geojson`,
        });
      }
      if (!map.getLayer(OSM_BUS_STOPS_LAYER)) {
        map.addLayer({
          id: OSM_BUS_STOPS_LAYER,
          type: 'circle',
          source: OSM_BUS_STATIONS_SOURCE,
          layout: {
            visibility: 'visible',
          },
          paint: {
            'circle-color': '#0d9488',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-stroke-opacity': busActive ? 1 : 0,
            'circle-radius': busActive
              ? ['interpolate', ['linear'], ['zoom'], 10, 2.5, 14, 4.5, 18, 6]
              : 0,
            'circle-opacity': busActive
              ? ['interpolate', ['linear'], ['zoom'], 10, 0.45, 14, 0.9]
              : 0,
            'circle-opacity-transition': { duration: 350, delay: 0 },
            'circle-radius-transition': { duration: 350, delay: 0 },
            'circle-stroke-opacity-transition': { duration: 350, delay: 0 },
          },
        });
      }

      // ----------------------------------------------------
      // 6. (TOP) Metro Stations (Legacy Hand-Curated Dataset)
      // ----------------------------------------------------
      if (!map.getSource(METRO_STATIONS_SOURCE)) {
        map.addSource(METRO_STATIONS_SOURCE, {
          type: 'geojson',
          data: STATIONS_GEOJSON,
        });
      }
      if (!map.getLayer(METRO_STATIONS_LAYER)) {
        map.addLayer({
          id: METRO_STATIONS_LAYER,
          type: 'circle',
          source: METRO_STATIONS_SOURCE,
          layout: {
            visibility: 'visible',
          },
          paint: {
            'circle-color': [
              'case',
              ['==', ['get', 'isActive'], false],
              '#888888',
              ['get', 'lineColor'],
            ],
            'circle-stroke-color': [
              'case',
              ['boolean', ['get', 'isInterchange'], false],
              ['get', 'lineColor2'],
              '#ffffff',
            ],
            'circle-stroke-width': [
              'case',
              ['boolean', ['get', 'isInterchange'], false],
              3.5,
              1.5,
            ],
            'circle-radius': metroOn ? 7.5 : 0,
            'circle-opacity': metroOn
              ? ['case', ['==', ['get', 'isActive'], false], 0.55, 1]
              : 0,
            'circle-stroke-opacity': metroOn ? 1 : 0,
            'circle-opacity-transition': { duration: 350, delay: 0 },
            'circle-radius-transition': { duration: 350, delay: 0 },
            'circle-stroke-opacity-transition': { duration: 350, delay: 0 },
          },
        });
      }
    },
    [isVisible, cityId, basemap]
  );

  // Initialize Map and Permanent Listeners
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (maplibregl.getRTLTextPluginStatus() === 'unavailable') {
      maplibregl.setRTLTextPlugin('/mapbox-gl-rtl-text.js', true).catch((err: unknown) => {
        console.warn('RTL Plugin warning:', err);
      });
    }

    const initialStyle = theme === 'dark' ? CARTO_STYLES.dark : CARTO_STYLES.light;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: city.center,
      zoom: city.zoom,
      transformRequest: (url: string, resourceType?: string) => {
        // Intercept font glyph requests to use modern seamless Persian/Arabic glyphs
        if (resourceType === 'Glyphs' || url.includes('/fonts/')) {
          const match = url.match(/\/fonts\/[^/]+\/([0-9]+-[0-9]+\.pbf)/);
          if (match) {
            return {
              url: `https://demotiles.maplibre.org/font/Noto%20Sans%20Regular/${match[1]}`,
            };
          }
        }
        return { url };
      },
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    const interactiveLayers = [METRO_STATIONS_LAYER, OSM_BUS_STOPS_LAYER];

    interactiveLayers.forEach((layerId) => {
      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });
    });

    // Click on Metro Stations
    map.on('click', METRO_STATIONS_LAYER, (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (id) {
        const station = STATIONS_BY_ID.get(id);
        if (station && selectItemRef.current) {
          selectItemRef.current({ kind: 'metro', station }, { flyTo: true });
        }
      }
    });

    // Click on Bus Stops
    map.on('click', OSM_BUS_STOPS_LAYER, (e) => {
      const feat = e.features?.[0];
      if (!feat || !feat.properties) return;
      const geom = feat.geometry as GeoJSON.Point;
      const coords: [number, number] = [geom.coordinates[0], geom.coordinates[1]];
      const name = feat.properties.name || feat.properties['name:en'] || 'ایستگاه اتوبوس';
      const latinName = feat.properties['name:en'] || feat.properties.name_en || '';
      const id = String(feat.properties.id || feat.properties['@id'] || Math.random());

      if (selectItemRef.current) {
        selectItemRef.current(
          {
            kind: 'bus',
            stop: {
              id,
              name,
              latinName,
              address: feat.properties.address || '',
              coordinate: coords,
              lines: feat.properties.lines || '',
              isBRT: feat.properties.isBRT === true || feat.properties.isBRT === 'true',
              brtLine: feat.properties.brtLine || '',
              direction: feat.properties.direction || '',
              stationCode: String(feat.properties.ref || feat.properties.stationCode || ''),
              seat: '',
              shelter: '',
              light: '',
              disabledAccess: '',
              transportMode: 'اتوبوس',
              city: 'Tehran',
              dist: 0,
            },
          },
          { flyTo: true }
        );
      }
    });

    const onStyleData = () => {
      if (map.isStyleLoaded()) {
        setupSourcesAndLayers(map);
      }
    };

    map.on('load', () => {
      setIsLoaded(true);
      setupSourcesAndLayers(map);
    });

    map.on('styledata', onStyleData);

    map.on('rotate', () => {
      setBearing(map.getBearing());
    });

    return () => {
      map.off('styledata', onStyleData);
      map.remove();
      mapRef.current = null;
    };
  }, []); // Run once on mount

  // Instant Zero-Latency Basemap Toggle (Street vs Satellite) with Zero Style Re-mounting
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const isSat = basemap === 'satellite';
    if (map.getLayer(SATELLITE_RASTER_LAYER)) {
      map.setLayoutProperty(SATELLITE_RASTER_LAYER, 'visibility', isSat ? 'visible' : 'none');
      map.setPaintProperty(SATELLITE_RASTER_LAYER, 'raster-opacity', isSat ? 1 : 0);
    }
  }, [basemap, isLoaded]);

  // Update Theme Style only when light/dark theme actually changes
  const prevThemeRef = useRef(theme);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (prevThemeRef.current !== theme) {
      prevThemeRef.current = theme;
      const newStyle = theme === 'dark' ? CARTO_STYLES.dark : CARTO_STYLES.light;
      map.setStyle(newStyle);
    }
  }, [theme, isLoaded]);

  // Pure GPU-Accelerated Smooth Scaling & Opacity Layer Transitions
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const metroNow = isVisible('metro');
    const brtNow = isVisible('brt');
    const busNow = isVisible('bus');
    const busActive = busNow || brtNow;

    // 1. Metro Layer GPU Transitions
    if (map.getLayer(METRO_LINES_LAYER)) {
      map.setPaintProperty(METRO_LINES_LAYER, 'line-opacity', metroNow ? 0.85 : 0);
      map.setPaintProperty(METRO_LINES_LAYER, 'line-width', metroNow ? 3.5 : 0.5);
    }
    if (map.getLayer(METRO_STATIONS_LAYER)) {
      map.setPaintProperty(
        METRO_STATIONS_LAYER,
        'circle-opacity',
        metroNow ? ['case', ['==', ['get', 'isActive'], false], 0.55, 1] : 0
      );
      map.setPaintProperty(METRO_STATIONS_LAYER, 'circle-radius', metroNow ? 7.5 : 0);
      map.setPaintProperty(METRO_STATIONS_LAYER, 'circle-stroke-opacity', metroNow ? 1 : 0);
    }

    // 2. BRT Layer GPU Transitions
    if (map.getLayer(BRT_LINES_LAYER)) {
      map.setPaintProperty(BRT_LINES_LAYER, 'line-opacity', brtNow ? 0.9 : 0);
      map.setPaintProperty(BRT_LINES_LAYER, 'line-width', brtNow ? 3 : 0.5);
    }

    // 3. OSM Bus Stops Smooth Scaling and Fade Transitions
    if (map.getLayer(OSM_BUS_STOPS_LAYER)) {
      map.setPaintProperty(
        OSM_BUS_STOPS_LAYER,
        'circle-opacity',
        busActive ? ['interpolate', ['linear'], ['zoom'], 10, 0.45, 14, 0.9] : 0
      );
      map.setPaintProperty(
        OSM_BUS_STOPS_LAYER,
        'circle-stroke-opacity',
        busActive ? 1 : 0
      );
      map.setPaintProperty(
        OSM_BUS_STOPS_LAYER,
        'circle-radius',
        busActive ? ['interpolate', ['linear'], ['zoom'], 10, 2.5, 14, 4.5, 18, 6] : 0
      );
    }
  }, [isVisible, isLoaded]);

  // Dynamic City Switching (Updates OSM Bus Source and Camera)
  const prevCityIdRef = useRef(cityId);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (prevCityIdRef.current !== cityId) {
      prevCityIdRef.current = cityId;

      // Update Native MapLibre OSM Bus Source
      const busSource = map.getSource(OSM_BUS_STATIONS_SOURCE) as maplibregl.GeoJSONSource | undefined;
      if (busSource) {
        busSource.setData(`/data/${cityId}-bus.geojson`);
      }

      map.flyTo({
        center: city.center,
        zoom: city.zoom,
        duration: 1400,
        essential: true,
      });
    }
  }, [cityId, city, isLoaded]);

  // Update Route Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const source = map.getSource(ROUTE_LINE_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (route && route.length > 0) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route,
        },
      });
    } else {
      source.setData({
        type: 'FeatureCollection',
        features: [],
      });
    }
  }, [route, isLoaded]);

  // Handle Pending Camera flyTo
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !pendingFlyTo) return;

    map.flyTo({
      center: pendingFlyTo.center,
      zoom: pendingFlyTo.zoom ?? 15,
      padding: pendingFlyTo.padding ?? { top: 60, bottom: 280, left: 20, right: 20 },
      duration: 1200,
      essential: true,
    });

    clearPendingFlyTo();
  }, [pendingFlyTo, clearPendingFlyTo, isLoaded]);

  // Render Custom Selected Marker Pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    if (!selected) return;

    const coords = selectionCoordinates(selected);
    const el = document.createElement('div');
    el.className = 'selected-marker-pin';

    let bgColor = '#3b82f6';
    let iconSvg = '';

    if (selected.kind === 'metro') {
      bgColor = selected.station.lineColor;
      iconSvg =
        '<svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>';
    } else if (selected.kind === 'brt') {
      bgColor = '#0d9488';
      iconSvg =
        '<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M6 19v2"/><path d="M18 19v2"/></svg>';
    } else if (selected.kind === 'bus') {
      bgColor = '#64748b';
      iconSvg =
        '<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M6 19v2"/><path d="M18 19v2"/></svg>';
    } else if (selected.kind === 'place') {
      bgColor = '#a78bfa';
      iconSvg =
        '<svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
    }

    el.innerHTML = `
      <div style="background-color: ${bgColor};" class="flex items-center justify-center size-8 rounded-full border-2 border-white shadow-2xl ring-4 ring-black/20 animate-bounce">
        ${iconSvg}
      </div>
    `;

    selectedMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(coords)
      .addTo(map);
  }, [selected]);

  // Render User Location Pulse Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (!userLocation) return;

    const el = document.createElement('div');
    el.innerHTML = `
      <div class="relative flex items-center justify-center size-5">
        <div class="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75"></div>
        <div class="relative inline-flex size-4 rounded-full border-2 border-white bg-blue-600 shadow-md"></div>
      </div>
    `;

    userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat(userLocation)
      .addTo(map);
  }, [userLocation]);

  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });
  const handleResetBearing = () => {
    mapRef.current?.resetNorthPitch({ duration: 400 });
    setBearing(0);
  };
  const handleLocateUser = async () => {
    const pos = await requestPosition();
    if (pos && mapRef.current) {
      setUserLocation(pos);
      mapRef.current.flyTo({
        center: pos,
        zoom: 15,
        duration: 1200,
        essential: true,
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocateUser}
        onResetBearing={handleResetBearing}
        bearing={bearing}
        isLocating={geoLoading}
        className="absolute top-16 right-3 sm:right-4 z-20 rtl:right-auto rtl:left-3 sm:rtl:left-4"
      />
    </div>
  );
}
