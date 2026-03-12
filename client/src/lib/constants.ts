import type { AvailabilityDay } from "../types";

export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const defaultWeeklyDays: AvailabilityDay[] = [
  { dayOfWeek: 0, isEnabled: false, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 1, isEnabled: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 2, isEnabled: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 3, isEnabled: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 4, isEnabled: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 5, isEnabled: true, startTime: "09:00", endTime: "16:00" },
  { dayOfWeek: 6, isEnabled: false, startTime: "09:00", endTime: "17:00" }
];

export const timezones = [
  "Asia/Kolkata",
  "UTC",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Singapore"
];
