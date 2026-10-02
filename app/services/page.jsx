import Link from "next/link";
import { SERVICES, DOCTORS, formatMoney, DEPOSIT_SPECIALTIES, DEPOSIT_AMOUNT } from "@/lib/data";

export const metadata = { title: "Services and fees | Harborview Family Clinic" };

export default function ServicesPage() {
  return (
    <>
      <h1>Services and fees</h1>
      <p className="muted">All appointments are 30 minutes. Fees are paid at the clinic. Dermatology and cardiology visits need a refundable {formatMoney(DEPOSIT_AMOUNT)} deposit when you book.</p>
      <div className="panel table-wrap">
        <table data-testid="services-table">
          <thead><tr><th>Service</th><th>Specialty</th><th>Length</th><th>Fee</th><th>Deposit</th><th></th></tr></thead>
          <tbody>
            {SERVICES.map((s) => {
              const doc = DOCTORS.find((d) => d.specialty === s.specialty && !d.fullyBooked);
              return (
                <tr key={s.id} data-testid={`service-${s.id}`}>
                  <td>{s.name}</td><td>{s.specialty}</td><td>{s.minutes} min</td><td>{formatMoney(s.price)}</td>
                  <td>{DEPOSIT_SPECIALTIES.includes(s.specialty) ? formatMoney(DEPOSIT_AMOUNT) : "None"}</td>
                  <td>{doc && <Link href={`/doctors/${doc.id}`} data-testid={`book-service-${s.id}`}>Book</Link>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
