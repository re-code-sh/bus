import React, { createContext, useContext, useMemo, useState } from 'react';
import type { BasemapId } from '@/lib/map-styles';
import { storage } from '@/lib/storage';

const BASEMAP_STORAGE_KEY = 'istgah_basemap';
const DEFAULT_BASEMAP: BasemapId = 'street';

type BasemapContextValue = {
  basemap: BasemapId;
  setBasemap: (id: BasemapId) => void;
};

const BasemapContext = createContext<BasemapContextValue | null>(null);

export function BasemapProvider({ children }: { children: React.ReactNode }) {
  const [basemap, setBasemapState] = useState<BasemapId>(() => {
    const saved = storage.getString(BASEMAP_STORAGE_KEY, '');
    return saved === 'street' || saved === 'satellite' ? saved : DEFAULT_BASEMAP;
  });

  const setBasemap = (id: BasemapId) => {
    setBasemapState(id);
    storage.set(BASEMAP_STORAGE_KEY, id);
  };

  const value = useMemo<BasemapContextValue>(
    () => ({ basemap, setBasemap }),
    [basemap]
  );

  return <BasemapContext.Provider value={value}>{children}</BasemapContext.Provider>;
}

export function useBasemap(): BasemapContextValue {
  const ctx = useContext(BasemapContext);
  if (!ctx) throw new Error('useBasemap must be used within BasemapProvider');
  return ctx;
}
