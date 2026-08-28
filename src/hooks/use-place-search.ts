import { useEffect, useState } from 'react';
import type { CityId } from '@/lib/cities';
import { searchPlaces, type PlaceResult } from '@/lib/geocoding';
import type { Lang } from '@/lib/i18n';
import { useDebouncedValue } from './use-debounced-value';

export function usePlaceSearch(query: string, cityId: CityId, lang: Lang) {
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebouncedValue(query.trim(), 400);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setPlaces([]);
      setIsSearching(false);
      return;
    }

    const abortController = new AbortController();
    setIsSearching(true);

    searchPlaces(debouncedQuery, {
      cityId,
      lang,
      signal: abortController.signal,
    })
      .then((results) => {
        setPlaces(results);
        setIsSearching(false);
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          console.warn('Place search error', error);
          setPlaces([]);
          setIsSearching(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [debouncedQuery, cityId, lang]);

  return { places, isSearching };
}
