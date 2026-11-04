/**
 * Minimum time between writes of the last-update timestamp to the device store (milliseconds).
 * Streamed messages can arrive several times a second while driving; the exact time is kept in
 * memory and only persisted this often, which is plenty for minute-level freshness checks.
 */
export const LAST_DATA_UPDATE_PERSIST_INTERVAL_MS = 60 * 1000;

/**
 * Format the time of the last car data update for display, in the Homey's timezone.
 *
 * Example output: `4 Nov, 14:32`. Falls back to an ISO string when `Intl` does not support
 * the timezone or locale.
 *
 * @param epochMs - Timestamp in epoch milliseconds
 * @param timeZone - IANA timezone, e.g. `Europe/Amsterdam`
 * @returns Human readable timestamp
 */
export function formatLastUpdate(epochMs: number, timeZone: string | undefined): string {
  const date = new Date(epochMs);
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

/**
 * Check whether car data was updated within the given number of minutes.
 *
 * @param lastUpdateMs - Stored timestamp in epoch milliseconds (anything else counts as "no timestamp")
 * @param minutes - Maximum age in minutes
 * @param now - Current time in epoch milliseconds (injectable for tests)
 * @returns True when the timestamp exists and is at most `minutes` old
 */
export function isCarDataFresh(
  lastUpdateMs: unknown,
  minutes: number,
  now: number = Date.now()
): boolean {
  if (typeof lastUpdateMs !== 'number' || !Number.isFinite(lastUpdateMs)) {
    return false;
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes)) {
    return false;
  }
  return now - lastUpdateMs <= minutes * 60 * 1000;
}
