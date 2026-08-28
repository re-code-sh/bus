import React, { createContext, useContext, useCallback, useMemo, useRef, useState } from 'react';
import type { BusStop } from '@/lib/bus-stops';
import type { PlaceResult } from '@/lib/geocoding';
import { STATIONS, type Station } from '@/lib/stations';
import { fetchDrivingRoute } from '@/lib/routing';
import type { PaddingOptions } from 'maplibre-gl';

export type MapSelection =
  | { kind: 'metro'; station: Station }
  | { kind: 'brt'; stop: BusStop }
  | { kind: 'bus'; stop: BusStop }
  | { kind: 'place'; place: PlaceResult };

export function selectionCoordinates(sel: MapSelection): [number, number] {
  if (sel.kind === 'metro') return sel.station.coordinates;
  if (sel.kind === 'place') return sel.place.coordinate;
  return sel.stop.coordinate;
}

export function selectionLabel(sel: MapSelection, isRTL: boolean): string {
  if (sel.kind === 'metro') {
    return isRTL ? sel.station.name.fa : sel.station.name.en;
  }
  if (sel.kind === 'place') return sel.place.name;
  if (isRTL || !sel.stop.latinName) return sel.stop.name;
  return sel.stop.latinName;
}

type FlyToRequest = {
  id: number;
  center: [number, number];
  zoom?: number;
  padding?: PaddingOptions;
};

type StationsContextValue = {
  stations: Station[];
  selected: MapSelection | null;
  route: [number, number][] | null;
  routeDistance: number | null;
  routeDuration: number | null;
  routeLoading: boolean;
  userLocation: [number, number] | null;
  pendingFlyTo: FlyToRequest | null;
  selectItem: (item: MapSelection | null, options?: { flyTo?: boolean; zoom?: number }) => void;
  clearPendingFlyTo: () => void;
  setUserLocation: (coords: [number, number] | null) => void;
  fetchRoute: () => Promise<void>;
  clearRoute: () => void;
  getSelectionLabel: (isRTL: boolean) => string;
};

const StationsContext = createContext<StationsContextValue | null>(null);

export function StationsProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<MapSelection | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [pendingFlyTo, setPendingFlyTo] = useState<FlyToRequest | null>(null);
  const flyToIdRef = useRef(0);

  const selectItem = useCallback(
    (item: MapSelection | null, options?: { flyTo?: boolean; zoom?: number }) => {
      setSelected(item);
      if (options?.flyTo && item) {
        flyToIdRef.current += 1;
        setPendingFlyTo({
          id: flyToIdRef.current,
          center: selectionCoordinates(item),
          zoom: options.zoom ?? 15,
          padding: { top: 70, bottom: 320, left: 20, right: 20 },
        });
      }
      if (!item) {
        setRoute(null);
        setRouteDistance(null);
        setRouteDuration(null);
      }
    },
    []
  );

  const clearPendingFlyTo = useCallback(() => {
    setPendingFlyTo(null);
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setRouteDistance(null);
    setRouteDuration(null);
  }, []);

  const fetchRoute = useCallback(async () => {
    if (!userLocation || !selected) return;

    setRouteLoading(true);
    try {
      const destCoords = selectionCoordinates(selected);
      const res = await fetchDrivingRoute(userLocation, destCoords);
      if (res) {
        setRoute(res.coordinates);
        setRouteDistance(res.distanceKm);
        setRouteDuration(res.durationMin);
      }
    } finally {
      setRouteLoading(false);
    }
  }, [userLocation, selected]);

  const getSelectionLabel = useCallback(
    (isRTL: boolean) => (selected ? selectionLabel(selected, isRTL) : ''),
    [selected]
  );

  const value = useMemo<StationsContextValue>(
    () => ({
      stations: STATIONS,
      selected,
      route,
      routeDistance,
      routeDuration,
      routeLoading,
      userLocation,
      pendingFlyTo,
      selectItem,
      clearPendingFlyTo,
      setUserLocation,
      fetchRoute,
      clearRoute,
      getSelectionLabel,
    }),
    [
      selected,
      route,
      routeDistance,
      routeDuration,
      routeLoading,
      userLocation,
      pendingFlyTo,
      selectItem,
      clearPendingFlyTo,
      fetchRoute,
      clearRoute,
      getSelectionLabel,
    ]
  );

  return <StationsContext.Provider value={value}>{children}</StationsContext.Provider>;
}

export function useStations(): StationsContextValue {
  const ctx = useContext(StationsContext);
  if (!ctx) throw new Error('useStations must be used within StationsProvider');
  return ctx;
}
