"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDoctor, formatDate, formatMoney, startsAt, DEPOSIT_SPECIALTIES, DEPOSIT_AMOUNT } from "@/lib/data";
import { api, getSession, saveAppointment } from "@/lib/client";

function Field({ id, label, hint, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="field-error" data-testid={`error-${id}`}>{error}</span>}
    </div>
  );
}

function BookingForm() {
  const params = useSearchParams();
  const router = useRouter();
  const doctor = getDoctor(params.get("doctor"));
  const date = params.get("date") || "";
  const time = params.get("time") || "";
  const [form, setForm] = useState({ name: "", dob: "", guardian: "", phone: "", email: "", reason: "", insurance: "", card: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s?.user) setForm((f) => ({ ...f, name: f.name || s.user.name, email: f.email || s.user.email }));
  }, []);

  if (!doctor || !date || !time) {
    return (
      <div className="panel empty" data-testid="booking-missing">
        <h2>Choose a clinician and time first</h2>
        <p style={{ margin: "0 auto 16px" }}>Start from a clinician's profile to pick an appointment time.</p>
        <Link className="btn" href="/">Find a clinician</Link>
      </div>
    );
  }
  const needsDeposit = DEPOSIT_SPECIALTIES.includes(doctor.specialty);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    setBusy(true); setMessage(null); setErrors({});
    const { status, data } = await api("/api/appointments", {
      method: "POST",
      body: { doctorId: doctor.id, date, time, consent,
        patient: { name: form.name, dob: form.dob, guardian: form.guardian, phone: form.phone, email: form.email, reason: form.reason, insurance: form.insurance },
        payment: needsDeposit ? { card: form.card } : undefined },
    });
    setBusy(false);
    if (status === 201) {
      const s = getSession();
      saveAppointment({ ...data, startsAt: startsAt(date, time).toISOString(), owner: s?.user?.email || data.patient.email });
      router.push(`/appointments/confirmation?ref=${data.ref}`);
      return;
    }
    if (data.errors) setErrors(data.errors);
    setMessage({ type: "error", text: data.error || "We couldn't book that appointment. Try again." , code: data.code });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <p><Link href={`/doctors/${doctor.id}`} data-testid="change-time">Change time</Link></p>
      <h1>Book your appointment</h1>
      {message && (
        <div className="notice error" role="alert" data-testid="booking-error">
          {message.text}
          {(message.code === "slot_taken" || message.code === "slot_unavailable") && <> <Link href={`/doctors/${doctor.id}`}>Pick another time</Link>.</>}
        </div>
      )}
      <div className="book-layout">
        <div className="panel">
          <h2>Patient details</h2>
          <div className="grid-2">
            <Field id="name" label="Full name" error={errors.name}>
              <input id="name" data-testid="patient-name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} autoComplete="name" />
            </Field>
            <Field id="dob" label="Date of birth" error={errors.dob}>
              <input id="dob" type="date" data-testid="patient-dob" value={form.dob} onChange={set("dob")} aria-invalid={!!errors.dob} />
            </Field>
            <Field id="phone" label="Mobile number" hint="10 digits, used for appointment reminders" error={errors.phone}>
              <input id="phone" type="tel" data-testid="patient-phone" value={form.phone} onChange={set("phone")} aria-invalid={!!errors.phone} autoComplete="tel" />
            </Field>
            <Field id="email" label="Email" error={errors.email}>
              <input id="email" type="email" data-testid="patient-email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} autoComplete="email" />
            </Field>
          </div>
          <Field id="guardian" label="Parent or guardian name" hint="Required for patients under 18" error={errors.guardian}>
            <input id="guardian" data-testid="patient-guardian" value={form.guardian} onChange={set("guardian")} aria-invalid={!!errors.guardian} />
          </Field>
          <Field id="reason" label="Reason for visit" hint="A sentence is enough. It helps the clinician prepare." error={errors.reason}>
            <textarea id="reason" data-testid="patient-reason" value={form.reason} onChange={set("reason")} aria-invalid={!!errors.reason} />
          </Field>
          <Field id="insurance" label="Insurance member ID (optional)" hint="Format ABC-123456" error={errors.insurance}>
            <input id="insurance" data-testid="patient-insurance" value={form.insurance} onChange={set("insurance")} aria-invalid={!!errors.insurance} />
          </Field>
          {needsDeposit && (
            <Field id="card" label={`Card for the ${formatMoney(DEPOSIT_AMOUNT)} deposit`} hint="Refunded at your visit, or if you cancel more than 24 hours ahead" error={errors.card}>
              <input id="card" inputMode="numeric" data-testid="deposit-card" value={form.card} onChange={set("card")} aria-invalid={!!errors.card} autoComplete="cc-number" />
            </Field>
          )}
          <label className="check" htmlFor="consent">
            <input id="consent" type="checkbox" data-testid="consent-checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>I agree to the clinic's privacy notice and to receiving appointment reminders.</span>
          </label>
          {errors.consent && <p className="field-error" data-testid="error-consent">{errors.consent}</p>}
          <div style={{ marginTop: 22 }}>
            <button className="btn" data-testid="confirm-booking" disabled={busy} onClick={submit}>{busy ? "Booking..." : "Confirm booking"}</button>
          </div>
        </div>

        <aside className="panel summary" data-testid="booking-summary">
          <h3>Your appointment</h3>
          <dl>
            <dt>Clinician</dt><dd data-testid="summary-doctor">{doctor.name}</dd>
            <dt>Specialty</dt><dd>{doctor.specialty}</dd>
            <dt>Date</dt><dd data-testid="summary-date">{formatDate(date, { weekday: "short", day: "numeric", month: "long" })}</dd>
            <dt>Time</dt><dd data-testid="summary-time">{time}</dd>
            <dt>Where</dt><dd>{doctor.room}</dd>
            <dt>Visit fee</dt><dd>{formatMoney(doctor.fee)}</dd>
            {needsDeposit && <><dt>Deposit today</dt><dd data-testid="summary-deposit">{formatMoney(DEPOSIT_AMOUNT)}</dd></>}
            <dt className="total">Pay at clinic</dt><dd className="total" data-testid="summary-total">{formatMoney(doctor.fee - (needsDeposit ? DEPOSIT_AMOUNT : 0))}</dd>
          </dl>
        </aside>
      </div>
    </>
  );
}

export default function BookPage() {
  return <Suspense fallback={<p className="muted">Loading booking...</p>}><BookingForm /></Suspense>;
}
