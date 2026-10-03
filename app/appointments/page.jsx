"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, getSession, mergeAppointments, markCancelled } from "@/lib/client";
import { formatDate, parseDateKey } from "@/lib/data";

export default function AppointmentsPage() {
  const [session, setSession] = useState(undefined);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("upcoming");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState("");

  async function load() {
    const s = getSession();
    setSession(s);
    if (!s) return;
    const { status, data } = await api("/api/appointments", { auth: true });
    setItems(mergeAppointments(status === 200 ? data.appointments : [], s.user.email));
  }
  useEffect(() => { load(); }, []);

  if (session === undefined) return <p className="muted">Loading...</p>;
  if (!session) {
    return (
      <div className="panel empty" data-testid="appointments-login-required">
        <h2>Log in to see your appointments</h2>
        <p style={{ margin: "0 auto 16px" }}>Your bookings, cancellations and reschedules are kept in your account.</p>
        <Link className="btn" href="/login?next=/appointments" data-testid="login-to-view">Log in</Link>
      </div>
    );
  }

  const now = new Date();
  const upcoming = items.filter((a) => new Date(a.startsAt) > now && a.status === "confirmed");
  const past = items.filter((a) => !(new Date(a.startsAt) > now && a.status === "confirmed"));
  const shown = tab === "upcoming" ? upcoming : past;

  async function cancel(a) {
    setBusy(a.ref); setNotice(null);
    const { status, data } = await api(`/api/appointments/${a.ref}`, { method: "DELETE", auth: true, body: { startsAt: a.startsAt } });
    setBusy("");
    if (status === 200) { markCancelled(a.ref); setNotice({ type: "ok", text: `Appointment ${a.ref} with ${a.doctorName} is cancelled.` }); load(); }
    else setNotice({ type: "error", text: data.error || "We couldn't cancel that appointment." });
  }

  return (
    <>
      <h1>My appointments</h1>
      {notice && <div className={`notice ${notice.type}`} role="status" data-testid="appointments-notice">{notice.text}</div>}
      <div className="tabs" role="tablist">
        <button className="tab" role="tab" aria-selected={tab === "upcoming"} data-testid="tab-upcoming" onClick={() => setTab("upcoming")}>Upcoming ({upcoming.length})</button>
        <button className="tab" role="tab" aria-selected={tab === "past"} data-testid="tab-past" onClick={() => setTab("past")}>Past and cancelled ({past.length})</button>
      </div>
      <div className="panel">
        {shown.length === 0 ? (
          <div className="empty" data-testid="appointments-empty">
            {tab === "upcoming" ? <>No upcoming appointments. <Link href="/">Find a clinician</Link> to book one.</> : "Nothing here yet."}
          </div>
        ) : shown.map((a) => (
          <div className="appt" key={a.ref} data-testid={`appointment-${a.ref}`}>
            <div className="when">
              <span className="d">{parseDateKey(a.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
              <span className="t">{a.time}</span>
            </div>
            <div>
              <strong>{a.doctorName}</strong> <span className="muted">{a.specialty}</span>
              <div className="small muted">{a.reason}</div>
              <div className="small">Ref {a.ref} {a.status === "cancelled" ? <span className="badge red">Cancelled</span> : a.status === "completed" ? <span className="badge grey">Completed</span> : <span className="badge">Confirmed</span>}</div>
            </div>
            {tab === "upcoming" && (
              <div className="appt-actions">
                <Link className="btn secondary" href={`/appointments/reschedule?ref=${a.ref}`} data-testid={`reschedule-${a.ref}`}>Reschedule</Link>
                <button className="btn danger" data-testid={`cancel-${a.ref}`} disabled={busy === a.ref} onClick={() => cancel(a)}>{busy === a.ref ? "Cancelling..." : "Cancel"}</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 14 }}>You can cancel or reschedule up to 24 hours before your appointment. Within 24 hours, please call us on (555) 010-4400.</p>
    </>
  );
}
