import { addMonths, format, parseISO, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Clock3, Globe2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarMonth } from "../components/CalendarMonth";
import { api } from "../lib/api";
import type { BookingMonth, EventType } from "../types";

export function BookingPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [bookingData, setBookingData] = useState<BookingMonth | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [inviteeName, setInviteeName] = useState("");
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [inviteeNotes, setInviteeNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [eventOptions, setEventOptions] = useState<EventType[]>([]);

  useEffect(() => {
    async function loadBookingData() {
      try {
        setError("");
        const data = await api<BookingMonth>(`/book/${slug}?month=${month}`);
        setBookingData(data);
        const firstAvailableDate = data.days.find((day) => day.isAvailable)?.date ?? "";
        setSelectedDate((current) =>
          current && data.days.some((day) => day.date === current) ? current : firstAvailableDate
        );
        setSelectedTime("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load booking page.");
      }
    }

    void loadBookingData();
  }, [slug, month]);

  useEffect(() => {
    async function loadEventOptions() {
      try {
        const data = await api<EventType[]>("/event-types");
        setEventOptions(data);
      } catch {
        setEventOptions([]);
      }
    }

    void loadEventOptions();
  }, []);

  const selectedDay = useMemo(
    () => bookingData?.days.find((day) => day.date === selectedDate),
    [bookingData, selectedDate]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!bookingData || !selectedTime) {
      return;
    }

    setSubmitting(true);

    try {
      const meeting = await api<{ id: string }>(`/bookings`, {
        method: "POST",
        body: {
          eventTypeId: bookingData.eventType.id,
          startTime: new Date(selectedTime).toISOString(),
          timezone: bookingData.availability.timezone,
          inviteeName,
          inviteeEmail,
          inviteeNotes
        }
      });

      navigate(`/book/${slug}/confirmed/${meeting.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="booking-shell">
      {error ? <div className="banner error booking-banner">{error}</div> : null}
      <div className="booking-card">
        {bookingData ? (
          <>
            <section className="booking-summary">
              <div className="brand compact">
                <div className="brand-mark">S</div>
                <div>
                  <p>Scaler Scheduler</p>
                  <span>Public booking page</span>
                </div>
              </div>
              <h1>{bookingData.eventType.name}</h1>
              <p>{bookingData.eventType.description}</p>
              {eventOptions.length > 1 ? (
                <label className="booking-options-select">
                  Other booking options
                  <select
                    value={slug}
                    onChange={(event) => navigate(`/book/${event.target.value}`)}
                  >
                    {eventOptions.map((eventType) => (
                      <option key={eventType.id} value={eventType.slug}>
                        {eventType.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="summary-meta">
                <span className="inline-icon">
                  <Clock3 size={16} />
                  {bookingData.eventType.duration} minutes
                </span>
                <span className="inline-icon">
                  <Globe2 size={16} />
                  {bookingData.availability.timezone}
                </span>
              </div>
            </section>

            <section className="booking-picker">
              <div className="month-toolbar">
                <button
                  type="button"
                  className="icon-button"
                  onClick={() =>
                    setMonth(format(subMonths(parseISO(`${month}-01`), 1), "yyyy-MM"))
                  }
                >
                  <ChevronLeft size={16} />
                </button>
                <span>{format(parseISO(`${month}-01`), "MMMM yyyy")}</span>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() =>
                    setMonth(format(addMonths(parseISO(`${month}-01`), 1), "yyyy-MM"))
                  }
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="booking-grid">
                <CalendarMonth
                  month={bookingData.month}
                  days={bookingData.days}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                />

                <div className="slots-panel">
                  <h3>
                    {selectedDate ? format(parseISO(selectedDate), "EEEE, MMMM d") : "Select a date"}
                  </h3>
                  <div className="slots-list">
                    {selectedDay?.slots
                      .filter((slot) => slot.isAvailable)
                      .map((slot) => (
                        <button
                          key={slot.startTime}
                          type="button"
                          className={`slot-button${selectedTime === slot.startTime ? " active" : ""}`}
                          onClick={() => setSelectedTime(slot.startTime)}
                        >
                          {slot.label}
                        </button>
                      ))}
                    {!selectedDay?.slots.some((slot) => slot.isAvailable) ? (
                      <p className="empty-state">No open times for this date.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="booking-form">
              <h2>Enter details</h2>
              <form className="stack" onSubmit={handleSubmit}>
                <label>
                  Name
                  <input value={inviteeName} onChange={(event) => setInviteeName(event.target.value)} required />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={inviteeEmail}
                    onChange={(event) => setInviteeEmail(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Notes
                  <textarea
                    rows={4}
                    value={inviteeNotes}
                    onChange={(event) => setInviteeNotes(event.target.value)}
                    placeholder="Anything useful to know before the meeting?"
                  />
                </label>
                <button className="button primary full-width" type="submit" disabled={!selectedTime || submitting}>
                  {submitting ? "Scheduling..." : "Confirm booking"}
                </button>
              </form>
            </section>
          </>
        ) : (
          <div className="card">Loading booking page...</div>
        )}
      </div>
    </div>
  );
}
