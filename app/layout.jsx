import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "Book an appointment | Harborview Family Clinic",
  description: "Book appointments with Harborview Family Clinic clinicians: general practice, pediatrics, dermatology, cardiology, dental and physiotherapy.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main><div className="wrap">{children}</div></main>
        <footer className="site-footer">
          <div className="wrap">
            <span>Harborview Family Clinic, 48 Harbor Road</span>
            <span>Questions or same-day needs: (555) 010-4400</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
