import { Copy, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EventTypeForm } from "../components/EventTypeForm";
import { api } from "../lib/api";
import type { EventType } from "../types";

export function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [editing, setEditing] = useState<EventType | null>(null);
  const [error, setError] = useState("");

  async function loadEventTypes() {
    try {
      const data = await api<EventType[]>("/event-types");
      setEventTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event types.");
    }
  }

  useEffect(() => {
    void loadEventTypes();
  }, []);

  async function createEventType(payload: {
    name: string;
    slug: string;
    duration: number;
    description?: string;
  }) {
    await api<EventType>("/event-types", {
      method: "POST",
      body: payload
    });
    await loadEventTypes();
  }

  async function updateEventType(payload: {
    name: string;
    slug: string;
    duration: number;
    description?: string;
  }) {
    if (!editing) {
      return;
    }

    await api<EventType>(`/event-types/${editing.id}`, {
      method: "PUT",
      body: payload
    });
    setEditing(null);
    await loadEventTypes();
  }

  async function deleteEventType(id: string) {
    await api(`/event-types/${id}`, { method: "DELETE" });
    await loadEventTypes();
  }

  async function copyLink(slug: string) {
    const url = `${window.location.origin}/book/${slug}`;
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Scheduling</span>
          <h1>Event types</h1>
          <p>Create booking links that feel close to Calendly’s event setup flow.</p>
        </div>
      </header>

      {error ? <div className="banner error">{error}</div> : null}

      <section className="grid two">
        <EventTypeForm
          eventType={editing}
          onSubmit={editing ? updateEventType : createEventType}
          onCancel={editing ? () => setEditing(null) : undefined}
        />

        <div className="card list-card">
          <div className="card-header">
            <div>
              <h2>Your event types</h2>
              <p>Each event type gets a unique public booking page.</p>
            </div>
          </div>

          <div className="stack">
            {eventTypes.map((eventType) => (
              <article key={eventType.id} className="event-row">
                <div>
                  <h3>{eventType.name}</h3>
                  <p>{eventType.duration} min • /book/{eventType.slug}</p>
                </div>
                <div className="row-actions">
                  <Link className="icon-button" to={`/book/${eventType.slug}`} target="_blank">
                    View
                  </Link>
                  <button className="icon-button" type="button" onClick={() => void copyLink(eventType.slug)}>
                    <Copy size={16} />
                  </button>
                  <button className="icon-button" type="button" onClick={() => setEditing(eventType)}>
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => void deleteEventType(eventType.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}

            {eventTypes.length === 0 ? <p className="empty-state">No event types yet.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
