import rawBusStops from '@/assets/data/tehranBusStops.json';
import { MASHHAD_BRT_STOPS } from './mashhad-brt';
import type { Strings } from './i18n';
import type { FeatureCollection, Feature, Point } from 'geojson';
import { calcDistanceKm } from './stations';

export type BusStop = {
  id: string;
  name: string;
  latinName: string;
  address: string;
  coordinate: [number, number]; // [lng, lat]
  lines: string;
  isBRT: boolean;
  brtLine: string;
  direction: string;
  stationCode: string;
  seat: string;
  shelter: string;
  light: string;
  disabledAccess: string;
  transportMode: string;
  city: string;
  dist: number;
};

const TEHRAN_CENTER: [number, number] = [51.3890, 35.6892];

export function formatBusFacilityValue(
  value: string,
  lang: 'en' | 'fa',
  t: Pick<Strings, 'facilityYes' | 'facilityNo' | 'facilityNeeded'>
): string {
  const raw = value.trim();
  if (!raw) return '';
  if (lang === 'fa') return raw;

  const yes = new Set(['دارد', 'بله', 'هست', 'yes']);
  const no = new Set(['ندارد', 'خیر', 'نیست', 'no', 'عدم ن']);
  const needed = new Set(['نیاز', 'needed']);

  if (yes.has(raw) || yes.has(raw.toLowerCase())) return t.facilityYes;
  if (no.has(raw) || no.has(raw.toLowerCase())) return t.facilityNo;
  if (needed.has(raw) || needed.has(raw.toLowerCase())) return t.facilityNeeded;

  return raw;
}

function isBRTStop(brt: unknown): boolean {
  if (!brt || brt === '0') return false;
  const s = String(brt);
  return s.startsWith('BRT') || s.startsWith('brt');
}

export const TEHRAN_BUS_STOPS: BusStop[] = (
  rawBusStops.features as Array<{
    geometry: { type: string; coordinates: number[] };
    properties: Record<string, unknown>;
  }>
)
  .filter((f) => f.geometry.type === 'Point' && f.properties['XGEO'] && f.properties['YGEO'])
  .map((f) => {
    const p = f.properties;
    const brt = p['BRT'] as string | undefined;
    const lng = Number(p['XGEO']);
    const lat = Number(p['YGEO']);
    const dist = Math.round(calcDistanceKm(lng, lat, TEHRAN_CENTER[0], TEHRAN_CENTER[1]) * 10) / 10;

    return {
      id: String(p['OBJECTID']),
      name: String(p['NAME'] ?? ''),
      latinName: String(p['LATINNAME'] ?? ''),
      address: String(p['ADDRESS'] ?? ''),
      coordinate: [lng, lat] as [number, number],
      lines: String(p['LINESTATIO'] ?? ''),
      isBRT: isBRTStop(brt),
      brtLine: brt && isBRTStop(brt) ? brt : '',
      direction: String(p['DIRECTION'] ?? ''),
      stationCode: String(p['STATIONCOD'] ?? ''),
      seat: String(p['SEAT'] ?? ''),
      shelter: String(p['SHELTER'] ?? ''),
      light: String(p['LIGHT'] ?? ''),
      disabledAccess: String(p['DISABLED'] ?? ''),
      transportMode: String(p['TRANSPORTM'] ?? ''),
      city: 'Tehran',
      dist,
    };
  });

export const BUS_STOPS: BusStop[] = [...TEHRAN_BUS_STOPS, ...MASHHAD_BRT_STOPS];

export const TEHRAN_BRT_STOPS = TEHRAN_BUS_STOPS.filter((s) => s.isBRT);
export const TEHRAN_REGULAR_BUS_STOPS = TEHRAN_BUS_STOPS.filter((s) => !s.isBRT);

export const BRT_BUS_STOPS = [...TEHRAN_BRT_STOPS, ...MASHHAD_BRT_STOPS];
export const REGULAR_BUS_STOPS = TEHRAN_REGULAR_BUS_STOPS;

const BUS_STOPS_BY_ID = new Map<string, BusStop>(BUS_STOPS.map((s) => [s.id, s]));

export function getBusStopById(id: string): BusStop | undefined {
  return BUS_STOPS_BY_ID.get(id);
}

function toGeoJSON(stops: BusStop[], kind: 'brt' | 'bus'): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: stops.map(
      (s): Feature<Point> => ({
        type: 'Feature',
        properties: {
          id: s.id,
          name: s.name,
          latinName: s.latinName,
          address: s.address,
          lines: s.lines,
          brtLine: s.brtLine,
          dist: s.dist,
          kind,
        },
        geometry: { type: 'Point', coordinates: s.coordinate },
      })
    ),
  };
}

export const BRT_STOPS_GEOJSON = toGeoJSON(BRT_BUS_STOPS, 'brt');
export const REGULAR_BUS_STOPS_GEOJSON = toGeoJSON(REGULAR_BUS_STOPS, 'bus');

const MAX_RESULTS = 15;

export function searchBusStops(
  query: string,
  cityId: string = 'tehran'
): { brt: BusStop[]; bus: BusStop[] } {
  if (query.length < 2) return { brt: [], bus: [] };
  const q = query.trim().toLowerCase();
  const targetCity = cityId.toLowerCase();

  const cityStops = BUS_STOPS.filter((s) => s.city.toLowerCase() === targetCity);
  const brt: BusStop[] = [];
  const bus: BusStop[] = [];

  for (const stop of cityStops) {
    const matchName =
      stop.name.toLowerCase().includes(q) || stop.latinName.toLowerCase().includes(q);
    const matchLine =
      stop.lines.toLowerCase().includes(q) || stop.brtLine.toLowerCase().includes(q);
    const matchAddress = stop.address.toLowerCase().includes(q);

    if (matchName || matchLine || matchAddress) {
      if (stop.isBRT && brt.length < MAX_RESULTS) brt.push(stop);
      else if (!stop.isBRT && bus.length < MAX_RESULTS) bus.push(stop);
    }
    if (brt.length >= MAX_RESULTS && bus.length >= MAX_RESULTS) break;
  }

  return { brt, bus };
}

export function listBrtStops(cityId: string = 'tehran', query = ''): BusStop[] {
  const targetCity = cityId.toLowerCase();
  const source = targetCity === 'mashhad' ? MASHHAD_BRT_STOPS : TEHRAN_BRT_STOPS;

  if (!query.trim()) return source;
  const q = query.trim().toLowerCase();

  return source.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.latinName.toLowerCase().includes(q) ||
      s.lines.toLowerCase().includes(q) ||
      s.brtLine.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
  );
}
