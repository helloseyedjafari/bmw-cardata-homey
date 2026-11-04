import { formatLastUpdate, isCarDataFresh } from '../../utils/CarDataFreshness';

describe('CarDataFreshness', () => {
  describe('formatLastUpdate', () => {
    it('should_formatInTheGivenTimezone', () => {
      const epoch = Date.parse('2026-11-04T13:32:00Z');

      expect(formatLastUpdate(epoch, 'Europe/Amsterdam')).toBe('4 Nov, 14:32');
      expect(formatLastUpdate(epoch, 'UTC')).toBe('4 Nov, 13:32');
      expect(formatLastUpdate(epoch, 'America/New_York')).toBe('4 Nov, 08:32');
    });

    it('should_rollOverTheDate_when_timezoneIsAheadOfUtc', () => {
      const epoch = Date.parse('2026-11-04T23:05:00Z');

      expect(formatLastUpdate(epoch, 'Europe/Amsterdam')).toBe('5 Nov, 00:05');
    });

    it('should_fallBackToIsoString_when_timezoneIsInvalid', () => {
      const epoch = Date.parse('2026-11-04T13:32:00Z');

      expect(formatLastUpdate(epoch, 'Not/AZone')).toBe('2026-11-04T13:32:00.000Z');
    });
  });

  describe('isCarDataFresh', () => {
    const now = Date.parse('2026-11-04T12:00:00Z');
    const minutesAgo = (minutes: number) => now - minutes * 60 * 1000;

    it('should_returnTrue_when_updatedWithinWindow', () => {
      expect(isCarDataFresh(minutesAgo(10), 30, now)).toBe(true);
    });

    it('should_returnTrue_when_updatedExactlyAtWindowEdge', () => {
      expect(isCarDataFresh(minutesAgo(30), 30, now)).toBe(true);
    });

    it('should_returnFalse_when_updatedOutsideWindow', () => {
      expect(isCarDataFresh(minutesAgo(30) - 1, 30, now)).toBe(false);
      expect(isCarDataFresh(minutesAgo(120), 30, now)).toBe(false);
    });

    it('should_returnFalse_when_noTimestampStored', () => {
      expect(isCarDataFresh(undefined, 30, now)).toBe(false);
      expect(isCarDataFresh(null, 30, now)).toBe(false);
      expect(isCarDataFresh('yesterday', 30, now)).toBe(false);
      expect(isCarDataFresh(Number.NaN, 30, now)).toBe(false);
    });

    it('should_returnFalse_when_minutesIsNotANumber', () => {
      expect(isCarDataFresh(minutesAgo(1), Number.NaN, now)).toBe(false);
      expect(isCarDataFresh(minutesAgo(1), undefined as unknown as number, now)).toBe(false);
    });

    it('should_useCurrentTime_when_nowNotProvided', () => {
      expect(isCarDataFresh(Date.now(), 1)).toBe(true);
      expect(isCarDataFresh(Date.now() - 2 * 60 * 1000, 1)).toBe(false);
    });
  });
});
