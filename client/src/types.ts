export type EventType = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  duration: number;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AvailabilityDay = {
  id?: string;
  dayOfWeek: number;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
};

export type AvailabilityOverride = {
  id?: string;
  date: string;
  isEnabled: boolean;
  startTime?: string | null;
  endTime?: string | null;
};

export type Availability = {
  id: string;
  userId: string;
  timezone: string;
  weeklyDays: AvailabilityDay[];
  overrides: AvailabilityOverride[];
};

export type Meeting = {
  id: string;
  userId: string;
  eventTypeId: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteeNotes: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  status: "SCHEDULED" | "CANCELLED";
  cancelledAt: string | null;
  cancelReason: string | null;
  eventType: EventType;
};

export type BookingMonth = {
  eventType: EventType;
  availability: {
    timezone: string;
  };
  month: string;
  days: Array<{
    date: string;
    isAvailable: boolean;
    slots: Array<{
      startTime: string;
      label: string;
      isAvailable: boolean;
    }>;
  }>;
};
