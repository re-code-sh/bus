import React, { createContext, useContext, useMemo, useState, useTransition } from 'react';

export type LayerKey = 'metro' | 'brt' | 'bus';
export const LAYER_KEYS: LayerKey[] = ['metro', 'brt', 'bus'];
const DEFAULT_LAYERS: LayerKey[] = ['metro', 'brt'];

function toggleSet(prev: Set<LayerKey>, key: LayerKey): Set<LayerKey> {
  const next = new Set(prev);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

type MapLayersContextValue = {
  mapLayers: Set<LayerKey>;
  sheetLayers: Set<LayerKey>;
  visibleLayers: Set<LayerKey>;
  isPending: boolean;
  isVisible: (key: LayerKey) => boolean;
  isSheetVisible: (key: LayerKey) => boolean;
  toggleLayer: (key: LayerKey) => void;
  setVisibleLayers: (keys: LayerKey[]) => void;
};

const MapLayersContext = createContext<MapLayersContextValue | null>(null);

export function MapLayersProvider({ children }: { children: React.ReactNode }) {
  const [mapLayers, setMapLayers] = useState<Set<LayerKey>>(() => new Set(DEFAULT_LAYERS));
  const [sheetLayers, setSheetLayers] = useState<Set<LayerKey>>(() => new Set(DEFAULT_LAYERS));
  const [isPending, startTransition] = useTransition();

  const toggleLayer = (key: LayerKey) => {
    setMapLayers((prev) => {
      const next = toggleSet(prev, key);
      startTransition(() => {
        setSheetLayers(next);
      });
      return next;
    });
  };

  const setVisibleLayers = (keys: LayerKey[]) => {
    const next = new Set(keys);
    setMapLayers(next);
    startTransition(() => {
      setSheetLayers(next);
    });
  };

  const isVisible = (key: LayerKey) => mapLayers.has(key);
  const isSheetVisible = (key: LayerKey) => sheetLayers.has(key);

  const value = useMemo<MapLayersContextValue>(
    () => ({
      mapLayers,
      sheetLayers,
      visibleLayers: mapLayers,
      isPending,
      isVisible,
      isSheetVisible,
      toggleLayer,
      setVisibleLayers,
    }),
    [mapLayers, sheetLayers, isPending]
  );

  return <MapLayersContext.Provider value={value}>{children}</MapLayersContext.Provider>;
}

export function useMapLayers(): MapLayersContextValue {
  const ctx = useContext(MapLayersContext);
  if (!ctx) throw new Error('useMapLayers must be used within MapLayersProvider');
  return ctx;
}
