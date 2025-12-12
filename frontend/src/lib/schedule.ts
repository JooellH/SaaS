export type TimeInterval = { start: string; end: string };

export type ScheduleUiRow = {
  id: string;
  weekday: number;
  openTime: string;
  closeTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
};

const isInterval = (value: unknown): value is TimeInterval =>
  typeof value === "object" &&
  value !== null &&
  "start" in value &&
  "end" in value &&
  typeof (value as { start?: unknown }).start === "string" &&
  typeof (value as { end?: unknown }).end === "string";

export const normalizeIntervals = (raw: unknown): TimeInterval[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isInterval);
};

export const mapSchedulesFromApi = (rows: unknown): ScheduleUiRow[] => {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      if (typeof row !== "object" || row === null) return null;
      const id = (row as { id?: unknown }).id;
      const weekday = (row as { weekday?: unknown }).weekday;
      const intervals = normalizeIntervals((row as { intervals?: unknown }).intervals);

      if (typeof id !== "string" || typeof weekday !== "number") return null;

      const first = intervals[0];
      const last = intervals[intervals.length - 1];

      const result: ScheduleUiRow = {
        id,
        weekday,
        openTime: first?.start ?? "-",
        closeTime: last?.end ?? "-",
        breakStart: null,
        breakEnd: null,
      };

      if (intervals.length === 2) {
        result.breakStart = intervals[0]?.end ?? null;
        result.breakEnd = intervals[1]?.start ?? null;
      }

      return result;
    })
    .filter((row): row is ScheduleUiRow => Boolean(row));
};

