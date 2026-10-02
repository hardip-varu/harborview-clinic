"use client";
// Browser-side session and appointment storage. The API is stateless, so the
// patient's own bookings live in localStorage and the seeded ones come from the API.

const SESSION_KEY = "hv.session";
const APPTS_KEY = "hv.appointments";
const CANCELLED_KEY = "hv.cancelled";

function read(key, fallback) {
  try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}
function write(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  window.dispatchEvent(new Event("hv-change"));
}

export function getSession() { return read(SESSION_KEY, null); }
export function setSession(s) { write(SESSION_KEY, s); }
export function clearSession() { try { window.localStorage.removeItem(SESSION_KEY); } catch (e) {} window.dispatchEvent(new Event("hv-change")); }

export async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  const s = getSession();
  if (auth && s?.token) headers.Authorization = `Bearer ${s.token}`;
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  return { status: res.status, data: data || {} };
}

export function saveAppointment(appt) {
  const list = read(APPTS_KEY, []).filter((a) => a.ref !== appt.ref);
  list.push(appt);
  write(APPTS_KEY, list);
}
export function localAppointments() { return read(APPTS_KEY, []); }
export function findLocal(ref) { return localAppointments().find((a) => a.ref === ref) || null; }
export function markCancelled(ref) {
  const set = new Set(read(CANCELLED_KEY, []));
  set.add(ref);
  write(CANCELLED_KEY, [...set]);
}
export function cancelledRefs() { return new Set(read(CANCELLED_KEY, [])); }

// Seeded (from API) plus local bookings; local copies win, cancelled ones are flagged.
export function mergeAppointments(seeded, email) {
  const byRef = new Map();
  for (const a of seeded) byRef.set(a.ref, a);
  for (const a of localAppointments()) if (!email || a.patient?.email === email || a.owner === email) byRef.set(a.ref, a);
  const cancelled = cancelledRefs();
  return [...byRef.values()].map((a) => (cancelled.has(a.ref) ? { ...a, status: "cancelled" } : a))
    .sort((x, y) => new Date(x.startsAt) - new Date(y.startsAt));
}

export function initials(name) {
  return name.replace(/^Dr\.\s*/, "").split(/[\s,]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
