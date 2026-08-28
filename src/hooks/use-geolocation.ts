import { useCallback, useEffect, useState } from 'react';

export type GeolocationState = {
  coords: [number, number] | null; // [lng, lat]
  accuracy: number | null;
  heading: number | null;
  error: GeolocationPositionError | null;
  loading: boolean;
};

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    accuracy: null,
    heading: null,
    error: null,
    loading: false,
  });

  const requestPosition = useCallback(async (): Promise<[number, number] | null> => {
    if (!navigator.geolocation) {
      return null;
    }

    setState((prev) => ({ ...prev, loading: true }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setState({
            coords,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            error: null,
            loading: false,
          });
          resolve(coords);
        },
        (err) => {
          setState((prev) => ({ ...prev, error: err, loading: false }));
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000, ...options }
      );
    });
  }, [options]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          coords: [pos.coords.longitude, pos.coords.latitude],
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState((prev) => ({ ...prev, error: err, loading: false }));
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000, ...options }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [options]);

  return { ...state, requestPosition };
}
