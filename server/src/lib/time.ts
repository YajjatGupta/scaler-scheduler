import { addMinutes, eachDayOfInterval, formatISO, getDay, isSameDay, parse, startOfDay } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { Meeting, MeetingStatus } from "@prisma/client";

type TimeRange = {
  startTime: string;
  endTime: string;
  isEnabled: boolean;
};

export function toUtcDate(date: string, time: string, timezone: string) {
  return fromZonedTime(`${date} ${time}`, timezone);
}

export function formatDateKey(date: Date, timezone: string) {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}

export function formatTimeLabel(date: Date, timezone: string) {
  return formatInTimeZone(date, timezone, "h:mm a");
}

export function getMonthDateRange(month: string, timezone: string) {
  const monthDate = parse(`${month}-01`, "yyyy-MM-dd", new Date());
  const start = startOfDay(toZonedTime(monthDate, timezone));
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  return { start, end };
}

export function getDatesInMonth(month: string, timezone: string) {
  const { start, end } = getMonthDateRange(month, timezone);
  return eachDayOfInterval({ start, end });
}

export function buildSlotsForDate(params: {
  date: string;
  timezone: string;
  duration: number;
  weeklyRange?: TimeRange;
  overrideRange?: TimeRange | null;
  meetings: Meeting[];
}) {
  const { date, timezone, duration, weeklyRange, overrideRange, meetings } = params;
  const activeRange = overrideRange ?? weeklyRange;

  if (!activeRange || !activeRange.isEnabled) {
    return [];
  }

  const rangeStart = toUtcDate(date, activeRange.startTime, timezone);
  const rangeEnd = toUtcDate(date, activeRange.endTime, timezone);
  const slots: Array<{ startTime: string; label: string; isAvailable: boolean }> = [];

  for (let cursor = rangeStart; cursor < rangeEnd; cursor = addMinutes(cursor, duration)) {
    const slotEnd = addMinutes(cursor, duration);

    if (slotEnd > rangeEnd) {
      break;
    }

    const overlaps = meetings.some((meeting) => {
      if (meeting.status === MeetingStatus.CANCELLED) {
        return false;
      }

      return meeting.startTime < slotEnd && meeting.endTime > cursor;
    });

    slots.push({
      startTime: formatISO(cursor),
      label: formatTimeLabel(cursor, timezone),
      isAvailable: !overlaps && cursor > new Date()
    });
  }

  return slots;
}

export function groupMeetingsByDate(meetings: Meeting[], timezone: string) {
  const map = new Map<string, Meeting[]>();

  for (const meeting of meetings) {
    const key = formatDateKey(meeting.startTime, timezone);
    const existing = map.get(key) ?? [];
    existing.push(meeting);
    map.set(key, existing);
  }

  return map;
}

export function getDayOfWeekForDate(date: string, timezone: string) {
  const zoned = toZonedTime(`${date}T00:00:00`, timezone);
  return getDay(zoned);
}

export function isDateBlocked(date: string, meetings: Meeting[], timezone: string) {
  const zonedDate = toZonedTime(`${date}T00:00:00`, timezone);
  return meetings.some((meeting) => isSameDay(toZonedTime(meeting.startTime, timezone), zonedDate));
}
