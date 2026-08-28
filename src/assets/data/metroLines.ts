export const lineColors: Record<string, string> = {
  "1": "#FF0000", // Red Line
  "2": "#283890", // Blue Line
  "3": "#00aeef", // Navy Blue Line
  "4": "#fedc16", // Yellow Line
  "5": "#008000", // Green Line
  "6": "#f06ca9", // Purple Line
  "7": "#7e3e98", // Orange Line
  BRT: "#666666", // Grey for BRT lines
};

export const lineNames: Record<string, string> = {
  "1": "Line 1 (Red)",
  "2": "Line 2 (Blue)",
  "3": "Line 3 (Navy)",
  "4": "Line 4 (Yellow)",
  "5": "Line 5 (Green)",
  "6": "Line 6 (Purple)",
  "7": "Line 7 (Orange)",
  BRT: "BRT",
};

export const findStationColor = (lines: string): string | string[] => {
  if (lineColors[lines]) return lineColors[lines];
  const l: string[] = [];
  lines.split(",").forEach((line) => l.push(lineColors[line.trim()] ?? '#888888'));
  return l;
};

export const findIntersectionColor = (origin: string, destination: string): string => {
  if (origin === destination) return lineColors[origin] ?? '#888888';
  const s = origin.split(",");
  const d = destination.split(",");
  const overlap = s.filter((v) => d.indexOf(v.trim()) > -1);
  return lineColors[overlap[0]?.trim()] ?? '#888888';
};
