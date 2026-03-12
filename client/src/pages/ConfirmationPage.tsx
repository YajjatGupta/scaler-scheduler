import { CheckCircle2, Clock3, Mail, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Meeting } from "../types";

type MeetingDetails = Meeting & {
  localDate: string;
  localTime: string;
};

export function ConfirmationPage() {
  const { meetingId = "", slug = "" } = useParams();
  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);

  useEffect(() => {
    async function loadMeeting() {
      const data = await api<MeetingDetails>(`/meetings/${meetingId}`);
      setMeeting(data);
    }

    void loadMeeting();
  }, [meetingId]);

  if (!meeting) {
    return (
      <div className="booking-shell">
        <div className="booking-card">
          <div className="card">Loading confirmation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-shell">
      <div className="confirmation-card">
        <CheckCircle2 size={42} className="success-icon" />
        <h1>You are scheduled</h1>
        <p>A calendar invite would normally be sent here. This assignment stores the confirmed meeting details.</p>
        <div className="confirmation-list">
          <span className="inline-icon">
            <Clock3 size={16} />
            {meeting.localDate} at {meeting.localTime}
          </span>
          <span className="inline-icon">
            <Mail size={16} />
            {meeting.inviteeEmail}
          </span>
          <span className="inline-icon">
            <Video size={16} />
            {meeting.eventType.name}
          </span>
        </div>
        <div className="form-actions centered">
          <Link className="button secondary" to={`/book/${slug}`}>
            Book another time
          </Link>
          <Link className="button primary" to="/">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
