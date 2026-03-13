import { MeetingStatus, Prisma } from "@prisma/client";
import { addMinutes, format, isAfter } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { NextFunction, Request, Response, Router } from "express";
import { prisma } from "./lib/prisma.js";
import { getDefaultUser } from "./lib/defaultUser.js";
import {
  buildSlotsForDate,
  formatDateKey,
  getDatesInMonth,
  getDayOfWeekForDate,
  getMonthDateRange,
  toUtcDate
} from "./lib/time.js";
import { availabilitySchema, bookingSchema, cancelMeetingSchema, eventTypeSchema } from "./validation.js";

const router = Router();

function getOverrideForDate(
  overrides: Array<{
    date: Date;
    isEnabled: boolean;
    startTime: string | null;
    endTime: string | null;
  }>,
  dateKey: string,
  timezone: string
) {
  const overrideRecord = overrides.find((item) => formatDateKey(item.date, timezone) === dateKey);

  if (overrideRecord?.startTime && overrideRecord.endTime) {
    return {
      startTime: overrideRecord.startTime,
      endTime: overrideRecord.endTime,
      isEnabled: overrideRecord.isEnabled
    };
  }

  if (overrideRecord && !overrideRecord.isEnabled) {
    return {
      startTime: "00:00",
      endTime: "00:00",
      isEnabled: false
    };
  }

  return null;
}

function mapOverrideForWrite(override: {
  date: string;
  isEnabled: boolean;
  startTime?: string | null;
  endTime?: string | null;
}, timezone: string) {
  return {
    date: toUtcDate(override.date, "00:00", timezone),
    isEnabled: override.isEnabled,
    startTime: override.isEnabled ? (override.startTime ?? null) : null,
    endTime: override.isEnabled ? (override.endTime ?? null) : null
  };
}

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.get("/event-types", async (_req, res, next) => {
  try {
    const user = await getDefaultUser();
    const eventTypes = await prisma.eventType.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" }
    });

    res.json(eventTypes);
  } catch (error) {
    next(error);
  }
});

router.post("/event-types", async (req, res, next) => {
  try {
    const payload = eventTypeSchema.parse(req.body);
    const user = await getDefaultUser();
    const eventType = await prisma.eventType.create({
      data: {
        ...payload,
        description: payload.description || null,
        userId: user.id
      }
    });

    res.status(201).json(eventType);
  } catch (error) {
    next(error);
  }
});

router.put("/event-types/:id", async (req, res, next) => {
  try {
    const payload = eventTypeSchema.parse(req.body);
    const user = await getDefaultUser();
    const existingEventType = await prisma.eventType.findFirst({
      where: {
        id: req.params.id,
        userId: user.id
      }
    });

    if (!existingEventType) {
      return res.status(404).json({ message: "Event type not found." });
    }

    const eventType = await prisma.eventType.update({
      where: { id: existingEventType.id },
      data: {
        ...payload,
        description: payload.description || null
      }
    });

    res.json(eventType);
  } catch (error) {
    next(error);
  }
});

router.delete("/event-types/:id", async (req, res, next) => {
  try {
    const user = await getDefaultUser();
    const deleted = await prisma.eventType.deleteMany({
      where: {
        id: req.params.id,
        userId: user.id
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ message: "Event type not found." });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/availability", async (_req, res, next) => {
  try {
    const user = await getDefaultUser();
    const availability = await prisma.availability.findUnique({
      where: { userId: user.id },
      include: {
        weeklyDays: { orderBy: { dayOfWeek: "asc" } },
        overrides: { orderBy: { date: "asc" } }
      }
    });

    res.json(availability);
  } catch (error) {
    next(error);
  }
});

router.put("/availability", async (req, res, next) => {
  try {
    const payload = availabilitySchema.parse(req.body);
    const user = await getDefaultUser();

    const availability = await prisma.availability.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        timezone: payload.timezone,
        weeklyDays: {
          create: payload.weeklyDays
        },
        overrides: {
          create: payload.overrides.map((override) => mapOverrideForWrite(override, payload.timezone))
        }
      },
      update: {
        timezone: payload.timezone,
        weeklyDays: {
          deleteMany: {},
          create: payload.weeklyDays
        },
        overrides: {
          deleteMany: {},
          create: payload.overrides.map((override) => mapOverrideForWrite(override, payload.timezone))
        }
      },
      include: {
        weeklyDays: { orderBy: { dayOfWeek: "asc" } },
        overrides: { orderBy: { date: "asc" } }
      }
    });

    res.json(availability);
  } catch (error) {
    next(error);
  }
});

router.get("/book/:slug", async (req, res, next) => {
  try {
    const month = String(req.query.month ?? format(new Date(), "yyyy-MM"));

    const eventType = await prisma.eventType.findUnique({
      where: { slug: req.params.slug }
    });

    if (!eventType) {
      return res.status(404).json({ message: "Event type not found." });
    }

    const availability = await prisma.availability.findUnique({
      where: { userId: eventType.userId },
      include: {
        weeklyDays: true,
        overrides: true
      }
    });

    if (!availability) {
      return res.status(404).json({ message: "Availability not configured." });
    }

    const { start, end } = getMonthDateRange(month, availability.timezone);
    const meetings = await prisma.meeting.findMany({
      where: {
        userId: eventType.userId,
        status: MeetingStatus.SCHEDULED,
        startTime: {
          gte: start,
          lte: addMinutes(end, 24 * 60)
        }
      },
      orderBy: { startTime: "asc" }
    });

    const days = getDatesInMonth(month, availability.timezone).map((date) => {
      const dateKey = formatDateKey(date, availability.timezone);
      const override = getOverrideForDate(availability.overrides, dateKey, availability.timezone);
      const weeklyDay = availability.weeklyDays.find(
        (item) => item.dayOfWeek === getDayOfWeekForDate(dateKey, availability.timezone)
      );
      const slots = buildSlotsForDate({
        date: dateKey,
        timezone: availability.timezone,
        duration: eventType.duration,
        weeklyRange: weeklyDay,
        overrideRange: override,
        meetings
      });

      return {
        date: dateKey,
        isAvailable: slots.some((slot) => slot.isAvailable),
        slots
      };
    });

    return res.json({
      eventType,
      availability: {
        timezone: availability.timezone
      },
      month,
      days
    });
  } catch (error) {
    next(error);
  }
});

router.post("/bookings", async (req, res, next) => {
  try {
    const payload = bookingSchema.parse(req.body);
    const startTime = new Date(payload.startTime);

    if (!isAfter(startTime, new Date())) {
      return res.status(400).json({ message: "Only future time slots can be booked." });
    }

    const meeting = await prisma.$transaction(async (tx) => {
        const eventType = await tx.eventType.findUnique({
          where: { id: payload.eventTypeId }
        });

        if (!eventType) {
          throw new Error("EVENT_TYPE_NOT_FOUND");
        }

        const availability = await tx.availability.findUnique({
          where: { userId: eventType.userId },
          include: {
            weeklyDays: true,
            overrides: true
          }
        });

        if (!availability) {
          throw new Error("AVAILABILITY_NOT_CONFIGURED");
        }

        const endTime = addMinutes(startTime, eventType.duration);
        const dateKey = formatDateKey(startTime, availability.timezone);
        const dayStart = toUtcDate(dateKey, "00:00", availability.timezone);
        const dayEnd = addMinutes(dayStart, 24 * 60);
        const override = getOverrideForDate(availability.overrides, dateKey, availability.timezone);
        const weeklyDay = availability.weeklyDays.find(
          (item) => item.dayOfWeek === getDayOfWeekForDate(dateKey, availability.timezone)
        );
        const meetings = await tx.meeting.findMany({
          where: {
            userId: eventType.userId,
            status: MeetingStatus.SCHEDULED,
            startTime: { lt: dayEnd },
            endTime: { gt: dayStart }
          },
          orderBy: { startTime: "asc" }
        });
        const slots = buildSlotsForDate({
          date: dateKey,
          timezone: availability.timezone,
          duration: eventType.duration,
          weeklyRange: weeklyDay,
          overrideRange: override,
          meetings
        });
        const matchingSlot = slots.find(
          (slot) => slot.isAvailable && new Date(slot.startTime).getTime() === startTime.getTime()
        );

        if (!matchingSlot) {
          throw new Error("INVALID_BOOKING_SLOT");
        }

        const overlappingMeeting = meetings.find(
          (meetingRecord) => meetingRecord.startTime < endTime && meetingRecord.endTime > startTime
        );

        if (overlappingMeeting) {
          throw new Error("BOOKING_CONFLICT");
        }

        return tx.meeting.create({
          data: {
            userId: eventType.userId,
            eventTypeId: eventType.id,
            inviteeName: payload.inviteeName,
            inviteeEmail: payload.inviteeEmail,
            inviteeNotes: payload.inviteeNotes || null,
            startTime,
            endTime,
            timezone: payload.timezone
          },
          include: {
            eventType: true
          }
        });
      });

    return res.status(201).json(meeting);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EVENT_TYPE_NOT_FOUND") {
        return res.status(404).json({ message: "Event type not found." });
      }

      if (error.message === "AVAILABILITY_NOT_CONFIGURED") {
        return res.status(404).json({ message: "Availability not configured." });
      }

      if (error.message === "INVALID_BOOKING_SLOT") {
        return res.status(400).json({ message: "This start time is outside the allowed availability." });
      }

      if (error.message === "BOOKING_CONFLICT") {
        return res.status(409).json({ message: "This slot was just booked. Please choose another one." });
      }
    }

    next(error);
  }
});

router.get("/meetings", async (_req, res, next) => {
  try {
    const user = await getDefaultUser();
    const meetings = await prisma.meeting.findMany({
      where: { userId: user.id },
      include: {
        eventType: true
      },
      orderBy: { startTime: "asc" }
    });

    const now = new Date();
    const upcoming = meetings.filter(
      (meeting) => meeting.status === MeetingStatus.SCHEDULED && meeting.startTime >= now
    );
    const past = meetings.filter(
      (meeting) => meeting.status === MeetingStatus.CANCELLED || meeting.startTime < now
    );

    res.json({ upcoming, past });
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:id/cancel", async (req, res, next) => {
  try {
    const payload = cancelMeetingSchema.parse(req.body);
    const user = await getDefaultUser();
    const existingMeeting = await prisma.meeting.findFirst({
      where: {
        id: req.params.id,
        userId: user.id
      }
    });

    if (!existingMeeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    const meeting = await prisma.meeting.update({
      where: { id: existingMeeting.id },
      data: {
        status: MeetingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: payload.cancelReason || null
      },
      include: { eventType: true }
    });

    res.json(meeting);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id", async (req, res, next) => {
  try {
    const user = await getDefaultUser();
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: req.params.id,
        userId: user.id
      },
      include: {
        eventType: true
      }
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    return res.json({
      ...meeting,
      localDate: formatInTimeZone(meeting.startTime, meeting.timezone, "EEEE, MMMM d"),
      localTime: formatInTimeZone(meeting.startTime, meeting.timezone, "h:mm a")
    });
  } catch (error) {
    next(error);
  }
});

router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return res.status(409).json({ message: "A record with this value already exists." });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
    return res.status(409).json({ message: "This slot was just booked. Please choose another one." });
  }

  if (typeof error === "object" && error && "issues" in error) {
    return res.status(400).json({ message: "Validation failed.", error });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error." });
});

export default router;
