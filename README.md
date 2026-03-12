# Scaler Scheduler

A fullstack scheduling platform inspired by Calendly. The app includes:

- Admin event type management
- Weekly availability settings with timezone support
- Date-specific availability overrides
- Public booking pages with month calendar and slot selection
- Double-booking prevention
- Upcoming and past meetings view
- Meeting cancellation flow

## Tech Stack

- Frontend: React 19, Vite, React Router, TypeScript
- Backend: Node.js, Express 5, TypeScript
- Database: PostgreSQL with Prisma ORM
- Styling: Custom CSS with a Calendly-style layout and booking flow

## Project Structure

```text
client/   React SPA
server/   Express API + Prisma schema/seed
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a PostgreSQL database named `scaler_scheduler`.

3. Copy the environment template and update the database URL:

```bash
cp .env.example .env
```

4. Run Prisma migration and seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

5. Start both apps:

```bash
npm run dev
```

6. Open:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api`

## Available Scripts

```bash
npm run dev
npm run build
npm run prisma:migrate
npm run prisma:seed
```

## Core Data Model

### `User`

Single default admin user for the assignment. No auth flow is implemented.

### `EventType`

Stores the event name, duration, slug, description, and owner.

### `Availability`

Stores the user timezone and related weekly/default availability.

### `AvailabilityDay`

One row per weekday with enabled flag, start time, and end time.

### `AvailabilityOverride`

Optional per-date override for custom hours or blocked days.

### `Meeting`

Stores invitee details, start/end time, timezone, status, and cancellation metadata.

## Assumptions

- A single default user is considered logged in on the admin side.
- Event type links are public and do not require authentication.
- Double-booking prevention is enforced against overlapping scheduled meetings for the user.
- Slot generation is based on the event duration and the configured host availability.
- Email notifications are not implemented; confirmation is shown in-app.

## What Was Implemented

- CRUD for event types
- Weekly availability editing
- Date-specific availability overrides
- Public booking page with month calendar
- Time slot selection and invitee form
- Booking confirmation screen
- Meetings dashboard with upcoming/past split
- Meeting cancellation
- Seed data for event types, availability, overrides, and meetings
- Responsive layout for dashboard and booking flow

## Verification

Verified locally in this environment:

- `npm --workspace server run build`
- `npm --workspace client exec tsc -b`
- `npm --workspace client run build`

Note: `prisma validate` could not be fully verified here because Prisma attempted to fetch an engine binary over the network during validation.

## Future Improvements

- Rescheduling flow
- Buffer time before/after meetings
- Multiple availability schedules
- Email notifications
- Custom invitee questions
- Stronger transactional protection at the database level for concurrent bookings
