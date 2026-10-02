"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SPECIALTIES, searchDoctors, nextAvailable, formatDate, formatMoney, toDateKey } from "@/lib/data";
import { initials } from "@/lib/client";

export default function HomePage() {
  const [q, setQ] = useState("");
  const [specialty, setSpecialty] = useState("");
  const results = useMemo(() => searchDoctors({ q, specialty }), [q, specialty]);
  const [today, setToday] = useState(null);
  useEffect(() => { setToday(toDateKey(new Date())); }, []);

  return (
    <>
      <section className="hero">
        <div>
          <h1>See a Harborview clinician this week.</h1>
          <p>Choose a doctor, dentist or physiotherapist, pick a time that suits you, and get a confirmation straight away.</p>
        </div>
        <div className="hours" data-testid="clinic-hours">
          <strong>Opening hours</strong>
          Monday to Saturday, 9:00 to 17:00. Closed for lunch 13:00 to 14:00 and all day Sunday.
        </div>
      </section>

      <div className="finder" role="search">
        <div>
          <label htmlFor="q" className="small muted">Search by name or specialty</label>
          <input id="q" data-testid="search-input" placeholder="For example: Mehta, dental, skin" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label htmlFor="specialty" className="small muted">Specialty</label>
          <select id="specialty" data-testid="specialty-filter" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            <option value="">All specialties</option>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ alignSelf: "end" }}>
          <button className="btn secondary" data-testid="clear-filters" onClick={() => { setQ(""); setSpecialty(""); }} disabled={!q && !specialty}>Clear</button>
        </div>
      </div>

      <p className="result-count" data-testid="result-count">
        {results.length} {results.length === 1 ? "clinician" : "clinicians"}{specialty ? ` in ${specialty}` : ""}{q ? ` matching "${q}"` : ""}
      </p>

      {results.length === 0 ? (
        <div className="panel empty" data-testid="no-results">No clinicians match your search. Try another name, or clear the filters to see everyone.</div>
      ) : (
        <ul className="doc-list" data-testid="doctor-list">
          {results.map((d) => {
            const next = today ? nextAvailable(d.id) : undefined;
            return (
              <li className="doc-row" key={d.id} data-testid={`doctor-row-${d.id}`}>
                <span className="avatar" aria-hidden="true">{initials(d.name)}</span>
                <div>
                  <p className="doc-name">{d.name}</p>
                  <p className="doc-meta">{d.specialty}, {d.years} years experience, rated {d.rating} by {d.reviews} patients</p>
                  {next === undefined ? (
                    <p className="doc-next muted">Checking availability...</p>
                  ) : next ? (
                    <p className="doc-next" data-testid={`next-available-${d.id}`}>
                      Next available: <strong>{next.date === today ? "Today" : formatDate(next.date)} at {next.time}</strong>
                    </p>
                  ) : (
                    <p className="doc-next none" data-testid={`fully-booked-${d.id}`}>Fully booked for the next 14 days</p>
                  )}
                </div>
                <div className="doc-actions">
                  <span className="fee">{formatMoney(d.fee)} per visit</span>
                  <Link className="btn secondary" href={`/doctors/${d.id}`} data-testid={`view-times-${d.id}`}>View times</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
