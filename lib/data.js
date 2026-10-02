// All clinic data and booking rules live here, so behaviour is deterministic
// and identical in the UI and the API.

export const SPECIALTIES = [
  "General Practice",
  "Pediatrics",
  "Dermatology",
  "Cardiology",
  "Dental",
  "Physiotherapy",
];

// Specialist visits need a refundable deposit at booking.
export const DEPOSIT_SPECIALTIES = ["Dermatology", "Cardiology"];
export const DEPOSIT_AMOUNT = 25;

export const DOCTORS = [
  { id: "d1", name: "Dr. Priya Mehta", specialty: "General Practice", fee: 60, years: 14, rating: 4.9, reviews: 312, languages: ["English", "Hindi"], room: "Room 104", bio: "Family physician focused on preventive care, chronic condition management and annual check-ups." },
  { id: "d2", name: "Dr. Daniel Okafor", specialty: "General Practice", fee: 60, years: 9, rating: 4.7, reviews: 188, languages: ["English"], room: "Room 106", bio: "Sees adults for acute illness, travel health and same-week follow-ups." },
  { id: "d3", name: "Dr. Sofia Lindqvist", specialty: "Pediatrics", fee: 70, years: 11, rating: 4.9, reviews: 254, languages: ["English", "Swedish"], room: "Room 201", bio: "Cares for children from newborns to teens, including vaccinations and developmental checks." },
  { id: "d4", name: "Dr. Aisha Rahman", specialty: "Dermatology", fee: 95, years: 16, rating: 4.8, reviews: 401, languages: ["English", "Arabic"], room: "Room 305", bio: "Treats acne, eczema and psoriasis, and runs the clinic's skin cancer screening programme.", fullyBooked: true },
  { id: "d5", name: "Dr. Marco Bellini", specialty: "Dermatology", fee: 90, years: 7, rating: 4.6, reviews: 97, languages: ["English", "Italian"], room: "Room 306", bio: "General and cosmetic dermatology, mole checks and minor skin procedures." },
  { id: "d6", name: "Dr. Hannah Cho", specialty: "Cardiology", fee: 120, years: 18, rating: 4.9, reviews: 276, languages: ["English", "Korean"], room: "Room 402", bio: "Heart rhythm, blood pressure and cholesterol management, with on-site ECG." },
  { id: "d7", name: "Dr. Samuel Reyes", specialty: "Dental", fee: 80, years: 12, rating: 4.7, reviews: 219, languages: ["English", "Spanish"], room: "Room 110", bio: "Check-ups, cleanings, fillings and urgent dental pain appointments." },
  { id: "d8", name: "Dr. Leah Goldberg", specialty: "Dental", fee: 80, years: 6, rating: 4.5, reviews: 74, languages: ["English", "Hebrew"], room: "Room 112", bio: "Gentle dentistry for anxious patients and children over six." },
  { id: "d9", name: "Tom Whitfield, DPT", specialty: "Physiotherapy", fee: 65, years: 10, rating: 4.8, reviews: 163, languages: ["English"], room: "Rehab suite", bio: "Back and neck pain, sports injuries and post-surgery rehabilitation." },
  { id: "d10", name: "Dr. Nadia Petrova", specialty: "Pediatrics", fee: 70, years: 5, rating: 4.6, reviews: 58, languages: ["English", "Russian"], room: "Room 203", bio: "Paediatric asthma, allergies and school health forms." },
];

export const SERVICES = [
  { id: "s1", name: "General consultation", specialty: "General Practice", minutes: 30, price: 60 },
  { id: "s2", name: "Annual health check", specialty: "General Practice", minutes: 30, price: 85 },
  { id: "s3", name: "Child vaccination visit", specialty: "Pediatrics", minutes: 30, price: 70 },
  { id: "s4", name: "Skin check", specialty: "Dermatology", minutes: 30, price: 95 },
  { id: "s5", name: "ECG and heart review", specialty: "Cardiology", minutes: 30, price: 120 },
  { id: "s6", name: "Dental check-up and clean", specialty: "Dental", minutes: 30, price: 80 },
  { id: "s7", name: "Physiotherapy session", specialty: "Physiotherapy", minutes: 30, price: 65 },
];

export function getDoctor(id) {
  return DOCTORS.find((d) => d.id === id) || null;
}

export function searchDoctors({ q = "", specialty = "" } = {}) {
  const term = String(q).trim().toLowerCase();
  return DOCTORS.filter((d) => {
    const matchesTerm = !term || d.name.toLowerCase().includes(term) || d.specialty.toLowerCase().includes(term);
    const matchesSpecialty = !specialty || d.specialty === specialty;
    return matchesTerm && matchesSpecialty;
  });
}

// ---------- schedule rules ----------
export const BOOKING_WINDOW_DAYS = 14;
export const ALWAYS_TAKEN_TIME = "10:30"; // shown free, but booking it always returns 409
export const CANCEL_CUTOFF_HOURS = 24;
const DAY_TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

export function toDateKey(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function parseDateKey(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function isSunday(key) {
  return parseDateKey(key).getDay() === 0;
}

// Small stable hash so the same doctor, date and time is always booked or free.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function bookingDates(from = new Date()) {
  const out = [];
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    out.push(toDateKey(d));
  }
  return out;
}

// Returns [{ time, available, reason }] for a doctor on a date.
export function slotsFor(doctorId, dateKey, now = new Date()) {
  const doctor = getDoctor(doctorId);
  if (!doctor || isSunday(dateKey)) return [];
  const todayKey = toDateKey(now);
  return DAY_TIMES.map((time) => {
    if (doctor.fullyBooked) return { time, available: false, reason: "booked" };
    const [hh, mm] = time.split(":").map(Number);
    const start = parseDateKey(dateKey); start.setHours(hh, mm, 0, 0);
    if (dateKey === todayKey && start <= now) return { time, available: false, reason: "past" };
    if (time !== ALWAYS_TAKEN_TIME && hash(`${doctorId}|${dateKey}|${time}`) % 4 === 0) return { time, available: false, reason: "booked" };
    return { time, available: true };
  });
}

export function nextAvailable(doctorId, now = new Date()) {
  for (const key of bookingDates(now)) {
    const slot = slotsFor(doctorId, key, now).find((s) => s.available);
    if (slot) return { date: key, time: slot.time };
  }
  return null;
}

export function startsAt(dateKey, time) {
  const [hh, mm] = time.split(":").map(Number);
  const d = parseDateKey(dateKey); d.setHours(hh, mm, 0, 0);
  return d;
}

export function hoursUntil(iso, now = new Date()) {
  return (new Date(iso).getTime() - now.getTime()) / 3600000;
}

export function formatDate(key, opts = { weekday: "short", day: "numeric", month: "short" }) {
  return parseDateKey(key).toLocaleDateString("en-GB", opts);
}

export function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}
