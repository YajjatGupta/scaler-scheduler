import { z } from "zod";

function isAscendingTimeRange(startTime: string, endTime: string) {
  return startTime < endTime;
}

export const eventTypeSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  duration: z.coerce.number().int().min(15).max(240),
  description: z.string().max(240).optional().or(z.literal(""))
});

export const availabilitySchema = z.object({
  timezone: z.string().min(2),
  weeklyDays: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      isEnabled: z.boolean(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/)
    })
  ).superRefine((weeklyDays, ctx) => {
    const seenDays = new Set<number>();

    weeklyDays.forEach((day, index) => {
      if (seenDays.has(day.dayOfWeek)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "dayOfWeek"],
          message: "Each weekday can only be configured once."
        });
      }

      seenDays.add(day.dayOfWeek);

      if (day.isEnabled && !isAscendingTimeRange(day.startTime, day.endTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "endTime"],
          message: "End time must be later than start time."
        });
      }
    });
  }),
  overrides: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      isEnabled: z.boolean(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional()
    })
  ).superRefine((overrides, ctx) => {
    const seenDates = new Set<string>();

    overrides.forEach((override, index) => {
      if (seenDates.has(override.date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "date"],
          message: "Each override date can only be configured once."
        });
      }

      seenDates.add(override.date);

      if (!override.isEnabled) {
        return;
      }

      if (!override.startTime || !override.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: "Enabled overrides require both start and end times."
        });
        return;
      }

      if (!isAscendingTimeRange(override.startTime, override.endTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "endTime"],
          message: "End time must be later than start time."
        });
      }
    });
  })
});

export const bookingSchema = z.object({
  eventTypeId: z.string().cuid(),
  startTime: z.string().datetime(),
  timezone: z.string().min(2),
  inviteeName: z.string().min(2).max(80),
  inviteeEmail: z.string().email(),
  inviteeNotes: z.string().max(400).optional().or(z.literal(""))
});

export const cancelMeetingSchema = z.object({
  cancelReason: z.string().max(240).optional().or(z.literal(""))
});
