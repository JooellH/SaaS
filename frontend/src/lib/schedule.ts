export type TimeInterval = { start: string; end: string };

export type ScheduleUiRow = {
  id: string;
  weekday: number;
  openTime: string;
  closeTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringId = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const toWeekday = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) return parsed;
  }
  return null;
};

const coerceInterval = (value: unknown): TimeInterval | null => {
  if (!isRecord(value)) return null;
  const start =
    (typeof value.start === "string" && value.start) ||
    (typeof value.startTime === "string" && value.startTime) ||
    (typeof value.openTime === "string" && value.openTime) ||
    (typeof value.open === "string" && value.open) ||
    null;
  const end =
    (typeof value.end === "string" && value.end) ||
    (typeof value.endTime === "string" && value.endTime) ||
    (typeof value.closeTime === "string" && value.closeTime) ||
    (typeof value.close === "string" && value.close) ||
    null;

  if (!start || !end) return null;
  return { start, end };
};

export const normalizeIntervals = (raw: unknown): TimeInterval[] => {
  const isTimeInterval = (value: TimeInterval | null): value is TimeInterval =>
    value !== null;

  if (Array.isArray(raw)) return raw.map(coerceInterval).filter(isTimeInterval);

  // Some backends serialize Json as a JSON string.
  if (typeof raw === "string" && raw.trim() !== "") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.map(coerceInterval).filter(isTimeInterval);
    } catch {
      // ignore
    }
  }

  return [];
};

export const mapSchedulesFromApi = (rows: unknown): ScheduleUiRow[] => {
  const list: unknown[] = Array.isArray(rows)
    ? rows
    : isRecord(rows) && Array.isArray(rows.data)
      ? (rows.data as unknown[])
      : isRecord(rows) && Array.isArray(rows.schedules)
        ? (rows.schedules as unknown[])
        : isRecord(rows) && Array.isArray(rows.items)
          ? (rows.items as unknown[])
          : [];

  return list
    .map((row) => {
      if (!isRecord(row)) return null;

      const id =
        toStringId(row.id) ??
        toStringId((row as { scheduleId?: unknown }).scheduleId) ??
        toStringId((row as { _id?: unknown })._id);

      const weekday =
        toWeekday(row.weekday) ??
        toWeekday((row as { dayOfWeek?: unknown }).dayOfWeek) ??
        toWeekday((row as { day?: unknown }).day);

      if (!id || weekday === null) return null;

      const intervalsRaw = (row as { intervals?: unknown }).intervals;
      let intervals = normalizeIntervals(intervalsRaw);

      if (intervals.length === 0) {
        const openTime = (row as { openTime?: unknown }).openTime;
        const closeTime = (row as { closeTime?: unknown }).closeTime;
        const fallback = coerceInterval({ openTime, closeTime });
        if (fallback) intervals = [fallback];
      }

      const first = intervals[0];
      const last = intervals[intervals.length - 1];

      const result: ScheduleUiRow = {
        id,
        weekday,
        openTime:
          first?.start ??
          (typeof (row as { openTime?: unknown }).openTime === "string"
            ? ((row as { openTime?: unknown }).openTime as string)
            : "-"),
        closeTime:
          last?.end ??
          (typeof (row as { closeTime?: unknown }).closeTime === "string"
            ? ((row as { closeTime?: unknown }).closeTime as string)
            : "-"),
        breakStart:
          typeof (row as { breakStart?: unknown }).breakStart === "string"
            ? ((row as { breakStart?: unknown }).breakStart as string)
            : null,
        breakEnd:
          typeof (row as { breakEnd?: unknown }).breakEnd === "string"
            ? ((row as { breakEnd?: unknown }).breakEnd as string)
            : null,
      };

      if (intervals.length === 2) {
        result.breakStart = intervals[0]?.end ?? null;
        result.breakEnd = intervals[1]?.start ?? null;
      }

      return result;
    })
    .filter((row): row is ScheduleUiRow => Boolean(row));
};
