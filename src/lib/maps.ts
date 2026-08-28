export function openMapsDirections(
  latitude: number,
  longitude: number,
  _label?: string
): void {
  const isApple = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
  const coords = `${latitude},${longitude}`;

  const url = isApple
    ? `https://maps.apple.com/?daddr=${coords}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${coords}`;

  window.open(url, '_blank', 'noopener,noreferrer');
}
