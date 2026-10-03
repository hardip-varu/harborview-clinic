import { getDoctor, slotsFor, startsAt, isSunday, bookingDates, ALWAYS_TAKEN_TIME, DEPOSIT_SPECIALTIES, DEPOSIT_AMOUNT, hoursUntil, CANCEL_CUTOFF_HOURS } from "./data";
import { isValidEmail } from "./users";

export const DECLINED_CARD = "4000000000000002";

// The browser and server may be a day apart (time zones), so accept one day either side.
export function inWindow(date, now = new Date()) {
  const yesterday = new Date(now.getTime() - 24 * 3600000);
  return bookingDates(yesterday).concat(bookingDates(now)).includes(date);
}
const INSURANCE_PATTERN = /^[A-Z]{3}-\d{6}$/;

export function ageOn(dob, now = new Date()) {
  const b = new Date(dob);
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

// Returns { errors } with field keys, or { ok, ... } with the cleaned booking.
export function validateBooking(body, now = new Date()) {
  const errors = {};
  const doctor = getDoctor(body?.doctorId);
  if (!doctor) return { status: 404, error: "Clinician not found.", errors: { doctorId: "Choose a clinician." } };

  const date = String(body?.date || "");
  const time = String(body?.time || "");
  if (!inWindow(date, now)) errors.date = "Choose a date within the next 14 days.";
  else if (isSunday(date)) errors.date = "The clinic is closed on Sundays.";
  if (!/^\d{2}:\d{2}$/.test(time)) errors.time = "Choose a time.";

  const p = body?.patient || {};
  const name = String(p.name || "").trim();
  if (name.length < 2) errors.name = "Enter the patient's full name.";
  if (!p.dob || isNaN(new Date(p.dob))) errors.dob = "Enter a date of birth.";
  else if (new Date(p.dob) >= now) errors.dob = "Date of birth must be in the past.";
  else if (ageOn(p.dob, now) < 18 && String(p.guardian || "").trim().length < 2) errors.guardian = "Patients under 18 need a parent or guardian name.";
  const phone = String(p.phone || "").replace(/\D/g, "");
  if (phone.length !== 10) errors.phone = "Enter a 10 digit phone number.";
  if (!isValidEmail(p.email)) errors.email = "Enter a valid email address.";
  if (String(p.reason || "").trim().length < 5) errors.reason = "Tell us briefly why you're coming in.";
  const insurance = String(p.insurance || "").trim().toUpperCase();
  if (insurance && !INSURANCE_PATTERN.test(insurance)) errors.insurance = "Use the format ABC-123456, or leave it blank.";
  if (!body?.consent) errors.consent = "Confirm you agree to the clinic's privacy notice.";

  const needsDeposit = DEPOSIT_SPECIALTIES.includes(doctor.specialty);
  const card = String(body?.payment?.card || "").replace(/\s/g, "");
  if (needsDeposit && !/^\d{16}$/.test(card)) errors.card = "Enter a 16 digit card number for the deposit.";

  if (Object.keys(errors).length) return { status: 400, error: "Some details need fixing.", errors };

  // The browser sends startsAt in its own time zone; API callers without it fall back to server time.
  const start = body?.startsAt && !isNaN(new Date(body.startsAt)) ? new Date(body.startsAt) : startsAt(date, time);
  if (start <= now) return { status: 422, error: "That time has already passed. Choose a later slot.", code: "slot_in_past" };

  const slot = slotsFor(doctor.id, date, new Date(0)).find((s) => s.time === time);
  if (!slot || !slot.available) return { status: 409, error: "That time is no longer available. Choose another slot.", code: "slot_unavailable" };
  if (time === ALWAYS_TAKEN_TIME) return { status: 409, error: "Someone just booked that time. Choose another slot.", code: "slot_taken" };
  if (needsDeposit && card === DECLINED_CARD) return { status: 402, error: "Your card was declined. Try a different card.", code: "card_declined" };

  return {
    ok: true,
    appointment: {
      ref: "HV-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      room: doctor.room,
      date,
      time,
      startsAt: start.toISOString(),
      patient: { name, email: String(p.email).trim().toLowerCase(), phone },
      reason: String(p.reason).trim(),
      fee: doctor.fee,
      deposit: needsDeposit ? DEPOSIT_AMOUNT : 0,
      status: "confirmed",
    },
  };
}

// Cancelling or rescheduling inside the cutoff is always refused.
export function checkChangeWindow(startsAtIso, now = new Date()) {
  if (!startsAtIso || isNaN(new Date(startsAtIso))) return { status: 400, error: "Missing the appointment time." };
  if (hoursUntil(startsAtIso, now) < 0) return { status: 422, error: "This appointment has already happened.", code: "in_past" };
  if (hoursUntil(startsAtIso, now) < CANCEL_CUTOFF_HOURS)
    return { status: 422, error: `Changes are only possible up to ${CANCEL_CUTOFF_HOURS} hours before your appointment. Please call us on (555) 010-4400 and we will help.`, code: "too_late" };
  return { ok: true };
}

// Seeded appointments for the demo patient, placed relative to now.
export function seededAppointments(email, now = new Date()) {
  if (email !== "demo@example.com") return [];
  const at = (hoursAhead) => {
    const d = new Date(now.getTime() + hoursAhead * 3600000);
    d.setMinutes(d.getMinutes() < 30 ? 0 : 30, 0, 0);
    return d;
  };
  const make = (ref, doctorId, d, status, reason) => {
    const doctor = getDoctor(doctorId);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return { ref, doctorId, doctorName: doctor.name, specialty: doctor.specialty, room: doctor.room, date: key, time, startsAt: d.toISOString(),
      patient: { name: "Jordan Lee", email, phone: "5550104400" }, reason, fee: doctor.fee, deposit: 0, status, seeded: true };
  };
  return [
    make("HV-SOON01", "d1", at(12), "confirmed", "Follow-up on blood test results"),
    make("HV-WEEK02", "d9", at(24 * 5), "confirmed", "Lower back pain, second session"),
    make("HV-PAST03", "d7", at(-24 * 10), "completed", "Routine dental check-up"),
  ];
}
