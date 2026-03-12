import { isPast, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Meeting } from "../types";

type MeetingsResponse = {
  upcoming: Meeting[];
  past: Meeting[];
};

function formatMeetingDateTime(meeting: Meeting) {
  const startTime = parseISO(meeting.startTime);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: meeting.timezone
  }).format(startTime);
}

function MeetingCard({ meeting, onCancel }: { meeting: Meeting; onCancel?: (id: string) => Promise<void> }) {
  return (
    <article className="meeting-card">
      <div>
        <h3>{meeting.eventType.name}</h3>
        <p>
          {meeting.inviteeName} • {meeting.inviteeEmail}
        </p>
        <p>{formatMeetingDateTime(meeting)}</p>
        <p>{meeting.timezone}</p>
      </div>
      <div className="meeting-meta">
        <span className={`pill ${meeting.status === "CANCELLED" ? "muted" : "active"}`}>
          {meeting.status === "CANCELLED"
            ? "Cancelled"
            : isPast(parseISO(meeting.startTime))
              ? "Completed"
              : "Upcoming"}
        </span>
        {meeting.status === "SCHEDULED" && onCancel ? (
          <button className="button secondary" type="button" onClick={() => void onCancel(meeting.id)}>
            Cancel
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingsResponse>({ upcoming: [], past: [] });

  async function loadMeetings() {
    const data = await api<MeetingsResponse>("/meetings");
    setMeetings(data);
  }

  useEffect(() => {
    void loadMeetings();
  }, []);

  async function cancelMeeting(id: string) {
    await api(`/meetings/${id}/cancel`, {
      method: "POST",
      body: {}
    });
    await loadMeetings();
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Meetings</span>
          <h1>Upcoming and past meetings</h1>
          <p>Track booked sessions and cancel them when needed.</p>
        </div>
      </header>

      <section className="grid two">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Upcoming</h2>
              <p>Future sessions that are still bookable on your calendar.</p>
            </div>
          </div>
          <div className="stack">
            {meetings.upcoming.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} onCancel={cancelMeeting} />
            ))}
            {meetings.upcoming.length === 0 ? <p className="empty-state">No upcoming meetings.</p> : null}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2>Past</h2>
              <p>Completed and cancelled sessions.</p>
            </div>
          </div>
          <div className="stack">
            {meetings.past.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
            {meetings.past.length === 0 ? <p className="empty-state">No meeting history yet.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
