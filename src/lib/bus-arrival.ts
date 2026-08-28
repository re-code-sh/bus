export const BUS_ARRIVAL_USSD = '*137*3*7*1#';

export async function openBusArrivalUssd(stationCode: string): Promise<boolean> {
  const code = stationCode.trim();
  if (!code) return false;

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(code);
    }
  } catch (err) {
    console.warn('Clipboard write failed', err);
  }

  // Open dialer
  window.location.href = `tel:${encodeURIComponent(BUS_ARRIVAL_USSD)}`;
  return true;
}
