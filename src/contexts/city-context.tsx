import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CITIES, DEFAULT_CITY_ID, isCityId, type City, type CityId } from '@/lib/cities';
import { storage } from '@/lib/storage';

const CITY_STORAGE_KEY = 'istgah_city';

type CityContextValue = {
  city: City;
  cityId: CityId;
  setCity: (id: CityId) => void;
};

const CityContext = createContext<CityContextValue | null>(null);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [cityId, setCityId] = useState<CityId>(() => {
    const saved = storage.getString(CITY_STORAGE_KEY, '');
    return isCityId(saved) ? saved : DEFAULT_CITY_ID;
  });

  const setCity = (id: CityId) => {
    setCityId(id);
    storage.set(CITY_STORAGE_KEY, id);
  };

  const value = useMemo<CityContextValue>(
    () => ({
      city: CITIES[cityId],
      cityId,
      setCity,
    }),
    [cityId]
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity(): CityContextValue {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within CityProvider');
  return ctx;
}
