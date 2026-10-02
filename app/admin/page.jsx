"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, getSession } from "@/lib/client";
import { DOCTORS, bookingDates, isSunday, slotsFor, formatDate, toDateKey } from "@/lib/data";

export default function AdminPage() {
  const [session, setS] = useState(undefined);
  const [form, setForm] = useState({ doctorId: "d1", date: "", time: "09:00", reason: "" });
  const [blocks, setBlocks] = useState([]);
  const [notice, setNotice] = useState(null);
  const [errors, setErrors] = useState({});
  const dates = bookingDates().filter((k) => !isSunday(k));
  useEffect(() => { setS(getSession()); }, []);

  if (session === undefined) return <p className="muted">Loading...</p>;
  if (!session) return <div className="panel empty" data-testid="admin-login-required"><h2>Staff area</h2><p style={{ margin: "0 auto 16px" }}>Log in with a staff account to manage the schedule.</p><Link className="btn" href="/login?next=/admin">Log in</Link></div>;
  if (session.user.role !== "staff") return <div className="panel empty" data-testid="admin-forbidden"><h2>Staff only</h2><p style={{ margin: "0 auto" }}>This area is for Harborview staff. Patients can manage bookings in My appointments.</p></div>;

  const today = toDateKey(new Date());
  const todays = isSunday(today) ? [] : DOCTORS.filter((d) => !d.fullyBooked).flatMap((d) =>
    slotsFor(d.id, today).filter((s) => !s.available && s.reason === "booked").map((s) => ({ doctor: d.name, time: s.time })))
    .sort((a, b) => a.time.localeCompare(b.time));

  async function block() {
    setNotice(null); setErrors({});
    const body = { ...form, date: form.date || dates[0] };
    const { status, data } = await api("/api/admin/blocks", { method: "POST", auth: true, body });
    if (status === 201) {
      setBlocks([data, ...blocks]);
      setNotice({ type: "ok", text: `Blocked ${DOCTORS.find((d) => d.id === data.doctorId).name} on ${formatDate(data.date)} at ${data.time}.` });
      setForm({ ...form, reason: "" });
    } else { setErrors(data.errors || {}); setNotice({ type: "error", text: data.error || "Couldn't block that time." }); }
  }

  return (
    <>
      <h1>Staff: schedule</h1>
      {notice && <div className={`notice ${notice.type}`} role="status" data-testid="admin-notice">{notice.text}</div>}
      <div className="panel">
        <h2>Block time</h2>
        <p className="muted small">For leave, training or room maintenance. Blocked times can't be booked.</p>
        <div className="grid-2">
          <div className="field"><label htmlFor="b-doc">Clinician</label>
            <select id="b-doc" data-testid="block-doctor" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
              {DOCTORS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div className="field"><label htmlFor="b-date">Date</label>
            <select id="b-date" data-testid="block-date" value={form.date || dates[0]} onChange={(e) => setForm({ ...form, date: e.target.value })}>
              {dates.map((k) => <option key={k} value={k}>{formatDate(k)}</option>)}
            </select></div>
          <div className="field"><label htmlFor="b-time">Time</label>
            <select id="b-time" data-testid="block-time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>
              {["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","14:00","14:30","15:00","15:30","16:00","16:30"].map((t) => <option key={t}>{t}</option>)}
            </select></div>
          <div className="field"><label htmlFor="b-reason">Reason</label>
            <input id="b-reason" data-testid="block-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} aria-invalid={!!errors.reason} />
            {errors.reason && <span className="field-error" data-testid="error-block-reason">{errors.reason}</span>}</div>
        </div>
        <button className="btn" data-testid="block-submit" onClick={block}>Block this time</button>
        {blocks.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 18 }}>
            <table data-testid="blocks-table"><thead><tr><th>Ref</th><th>Clinician</th><th>When</th><th>Reason</th></tr></thead>
              <tbody>{blocks.map((b) => <tr key={b.id}><td>{b.id}</td><td>{DOCTORS.find((d) => d.id === b.doctorId).name}</td><td>{formatDate(b.date)} {b.time}</td><td>{b.reason}</td></tr>)}</tbody></table>
          </div>
        )}
      </div>
      <div className="panel">
        <h2>Today's booked appointments</h2>
        {todays.length === 0 ? <p className="muted" data-testid="today-empty">No bookings today.</p> : (
          <div className="table-wrap"><table data-testid="today-table"><thead><tr><th>Time</th><th>Clinician</th></tr></thead>
            <tbody>{todays.map((r, i) => <tr key={i}><td>{r.time}</td><td>{r.doctor}</td></tr>)}</tbody></table></div>
        )}
      </div>
    </>
  );
}
