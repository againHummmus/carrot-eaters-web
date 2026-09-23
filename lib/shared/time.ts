import { DateTime } from 'luxon';

/** Returns the [start, end) UTC instants for a given calendar day in an IANA timezone. */
export function zonedDayRangeUtc(timeZone: string, localDate: Date): { start: Date; end: Date } {
  const start = DateTime.fromJSDate(localDate, { zone: timeZone }).startOf('day');
  return { start: start.toUTC().toJSDate(), end: start.plus({ days: 1 }).toUTC().toJSDate() };
}

export function todayRangeUtc(timeZone: string): { start: Date; end: Date } {
  return zonedDayRangeUtc(timeZone, new Date());
}

/** Inclusive [from, to] calendar-day range (in `timeZone`) as a UTC instant range. */
export function zonedPeriodRangeUtc(timeZone: string, fromDate: string, toDate: string): { start: Date; end: Date } {
  const start = DateTime.fromISO(fromDate, { zone: timeZone }).startOf('day');
  const end = DateTime.fromISO(toDate, { zone: timeZone }).startOf('day').plus({ days: 1 });
  return { start: start.toUTC().toJSDate(), end: end.toUTC().toJSDate() };
}

/** YYYY-MM-DD of an instant, as seen in `timeZone`. Used to bucket rows by local day. */
export function zonedDateKey(timeZone: string, instant: Date): string {
  return DateTime.fromJSDate(instant).setZone(timeZone).toFormat('yyyy-MM-dd');
}
