# Harborview Family Clinic

A realistic outpatient clinic appointment booking app, built as a deterministic test fixture for ContextQA. Patients find a clinician, pick a time, book with validation and an optional deposit, then manage their appointments. Staff can block time.

Built with Next.js 14 (App Router), plain CSS and no database. API routes are stateless, so it runs on Vercel with zero configuration.

## Run locally

```
npm install
npm run dev
```

Then open http://localhost:3000.

## Pages

| Page | What it does |
| --- | --- |
| `/` | Find a clinician: search by name or specialty, specialty filter, next available time |
| `/doctors/[id]` | Clinician profile with a 14 day slot picker (this week / next week) |
| `/book` | Patient details, consent, deposit for specialists, booking summary |
| `/appointments/confirmation` | Booking reference and appointment details |
| `/appointments` | Upcoming, past and cancelled appointments, with cancel and reschedule |
| `/appointments/reschedule` | Move an appointment to a new date and time |
| `/services` | Services, fees and deposits |
| `/login`, `/signup` | Patient and staff accounts |
| `/admin` | Staff only: block time, see today's bookings |

## Deterministic rules

Every rule below always behaves the same way, so test results are repeatable.

Accounts
- Patient login: `demo@example.com` / `password123` (has three seeded appointments)
- Staff login: `admin@example.com` / `admin123` (can open `/admin`)
- Signing up with `existing@example.com` always returns 409 (already registered)
- Passwords need at least 8 characters

Schedule
- Open Monday to Saturday, 09:00 to 17:00, in 30 minute slots. Lunch 13:00 to 14:00 has no slots.
- Sundays are always closed
- Bookings are allowed for the next 14 days only
- Dr. Aisha Rahman (Dermatology) is always fully booked
- The **10:30** slot always shows as free, but booking it always returns 409 "Someone just booked that time"
- Which other slots are taken is fixed per clinician, date and time, so the same slot is always free or always taken

Booking
- Required: full name, date of birth (in the past), 10 digit phone, valid email, reason (5+ characters), privacy consent
- Patients under 18 need a parent or guardian name
- Insurance member ID is optional, but if given must look like `ABC-123456`
- Dermatology and Cardiology need a refundable $25 deposit by card (16 digits)
- Card `4000000000000002` is always declined (402)

Changes
- Cancelling or rescheduling less than 24 hours before the appointment is always refused (422)
- Seeded appointments for the demo patient: one in about 12 hours (cannot be cancelled), one in 5 days (can be cancelled or moved), one in the past (completed)

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | /api/doctors?search=&specialty= | List clinicians with next available time |
| GET | /api/doctors/{id} | One clinician (404 if unknown) |
| GET | /api/doctors/{id}/slots?date=YYYY-MM-DD | Slots for a date (400 outside the window) |
| GET | /api/services | Services and fees |
| POST | /api/auth/login | 200, 400, 401 |
| POST | /api/auth/signup | 201, 400, 409 |
| GET | /api/appointments | Bearer token required (401 without) |
| POST | /api/appointments | 201, 400, 402, 404, 409 |
| PATCH | /api/appointments/{ref} | Reschedule: 200, 401, 409, 422 |
| DELETE | /api/appointments/{ref} | Cancel: 200, 401, 422 |
| POST | /api/admin/blocks | Staff only: 201, 400, 401, 403 |

Full details are in `openapi.yaml`.

## Notes

Data is not persisted. A patient's own new bookings, cancellations and reschedules are kept in the browser (localStorage), while the API validates every change, so behaviour is identical on any server instance.

This app is a test fixture for ContextQA.
Branch filter test into release/1.2
