import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { defaultWeeklyDays, timezones, weekdayLabels } from "../lib/constants";
import type { Availability, AvailabilityOverride } from "../types";

type AvailabilityState = {
  timezone: string;
  weeklyDays: typeof defaultWeeklyDays;
  overrides: AvailabilityOverride[];
};

export function AvailabilityPage() {
  const [state, setState] = useState<AvailabilityState>({
    timezone: "Asia/Kolkata",
    weeklyDays: defaultWeeklyDays,
    overrides: []
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadAvailability() {
      const data = await api<Availability | null>("/availability");

      if (!data) {
        return;
      }

      setState({
        timezone: data.timezone,
        weeklyDays: [...data.weeklyDays].sort((a, b) => a.dayOfWeek - b.dayOfWeek) as typeof defaultWeeklyDays,
        overrides: data.overrides.map((override) => ({
          ...override,
          date: override.date.slice(0, 10)
        }))
      });
    }

    void loadAvailability();
  }, []);

  function updateDay(dayOfWeek: number, key: "isEnabled" | "startTime" | "endTime", value: string | boolean) {
    setState((current) => ({
      ...current,
      weeklyDays: current.weeklyDays.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, [key]: value } : day
      ) as typeof defaultWeeklyDays
    }));
  }

  function addOverride() {
    setState((current) => ({
      ...current,
      overrides: [
        ...current.overrides,
        {
          date: "",
          isEnabled: true,
          startTime: "10:00",
          endTime: "14:00"
        }
      ]
    }));
  }

  function updateOverride(index: number, key: keyof AvailabilityOverride, value: string | boolean | null) {
    setState((current) => ({
      ...current,
      overrides: current.overrides.map((override, itemIndex) =>
        itemIndex === index ? { ...override, [key]: value } : override
      )
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("Saving...");

    try {
      await api("/availability", {
        method: "PUT",
        body: state
      });
      setStatus("Availability saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save availability.");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Schedule</span>
          <h1>Availability</h1>
          <p>Set weekly hours, timezone, and date-specific overrides.</p>
        </div>
      </header>

      <form className="grid two" onSubmit={handleSubmit}>
        <section className="card">
          <div className="card-header">
            <div>
              <h2>Weekly hours</h2>
              <p>Control when invitees can book time with you.</p>
            </div>
          </div>

          <label>
            Timezone
            <select
              value={state.timezone}
              onChange={(event) => setState((current) => ({ ...current, timezone: event.target.value }))}
            >
              {timezones.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
          </label>

          <div className="stack">
            {state.weeklyDays.map((day) => (
              <div className="availability-row" key={day.dayOfWeek}>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={day.isEnabled}
                    onChange={(event) => updateDay(day.dayOfWeek, "isEnabled", event.target.checked)}
                  />
                  <span>{weekdayLabels[day.dayOfWeek]}</span>
                </label>
                <input
                  type="time"
                  value={day.startTime}
                  disabled={!day.isEnabled}
                  onChange={(event) => updateDay(day.dayOfWeek, "startTime", event.target.value)}
                />
                <input
                  type="time"
                  value={day.endTime}
                  disabled={!day.isEnabled}
                  onChange={(event) => updateDay(day.dayOfWeek, "endTime", event.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Date overrides</h2>
              <p>Adjust hours for a specific day without changing the weekly schedule.</p>
            </div>
            <button type="button" className="button secondary" onClick={addOverride}>
              Add override
            </button>
          </div>

          <div className="stack">
            {state.overrides.map((override, index) => (
              <div className="override-card" key={`${override.date}-${index}`}>
                <label>
                  Date
                  <input
                    type="date"
                    value={override.date}
                    onChange={(event) => updateOverride(index, "date", event.target.value)}
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={override.isEnabled}
                    onChange={(event) => updateOverride(index, "isEnabled", event.target.checked)}
                  />
                  <span>Accept bookings on this date</span>
                </label>
                <div className="form-row">
                  <label>
                    Start
                    <input
                      type="time"
                      value={override.startTime ?? ""}
                      disabled={!override.isEnabled}
                      onChange={(event) => updateOverride(index, "startTime", event.target.value)}
                    />
                  </label>
                  <label>
                    End
                    <input
                      type="time"
                      value={override.endTime ?? ""}
                      disabled={!override.isEnabled}
                      onChange={(event) => updateOverride(index, "endTime", event.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}

            {state.overrides.length === 0 ? (
              <p className="empty-state">No date-specific hours configured.</p>
            ) : null}
          </div>

          <div className="form-actions">
            <span className="status-text">{status}</span>
            <button type="submit" className="button primary">
              Save availability
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
