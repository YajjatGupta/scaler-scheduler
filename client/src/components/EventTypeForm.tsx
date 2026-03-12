import { FormEvent, useEffect, useState } from "react";
import type { EventType } from "../types";

type Props = {
  eventType?: EventType | null;
  onSubmit: (payload: {
    name: string;
    slug: string;
    duration: number;
    description?: string;
  }) => Promise<void>;
  onCancel?: () => void;
};

export function EventTypeForm({ eventType, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    duration: 30,
    description: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventType) {
      return;
    }

    setForm({
      name: eventType.name,
      slug: eventType.slug,
      duration: eventType.duration,
      description: eventType.description ?? ""
    });
  }, [eventType]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      await onSubmit(form);

      if (!eventType) {
        setForm({
          name: "",
          slug: "",
          duration: 30,
          description: ""
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="card-header">
        <div>
          <h2>{eventType ? "Edit event type" : "Create event type"}</h2>
          <p>Define a shareable link with a fixed meeting duration.</p>
        </div>
      </div>

      <label>
        Event name
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="30 Minute Intro Call"
          required
        />
      </label>

      <div className="form-row">
        <label>
          URL slug
          <input
            value={form.slug}
            onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            placeholder="intro-call"
            required
          />
        </label>
        <label>
          Duration
          <input
            type="number"
            min={15}
            step={15}
            value={form.duration}
            onChange={(event) =>
              setForm((current) => ({ ...current, duration: Number(event.target.value) }))
            }
            required
          />
        </label>
      </div>

      <label>
        Description
        <textarea
          rows={4}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="Short explanation shown on the public booking page."
        />
      </label>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="button primary" disabled={saving}>
          {saving ? "Saving..." : eventType ? "Update event type" : "Create event type"}
        </button>
      </div>
    </form>
  );
}
