export type RouteResult = {
  coordinates: [number, number][]; // [lng, lat]
  distanceKm: number;
  durationMin: number;
};

export async function fetchDrivingRoute(
  origin: [number, number],
  destination: [number, number],
  signal?: AbortSignal
): Promise<RouteResult | null> {
  const [fromLng, fromLat] = origin;
  const [toLng, toLat] = destination;

  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();

    if (data.routes?.[0]) {
      const route = data.routes[0];
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[0], c[1]]
      );
      return {
        coordinates,
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
      };
    }
  } catch (error) {
    if (signal?.aborted) return null;
    console.error('OSRM route fetch failed', error);
  }
  return null;
}
