"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, clearSession } from "@/lib/client";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setS] = useState(null);
  useEffect(() => {
    const sync = () => setS(getSession());
    sync();
    window.addEventListener("hv-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("hv-change", sync); window.removeEventListener("storage", sync); };
  }, []);
  const link = (href, label, testid) => (
    <Link href={href} data-testid={testid} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
  );
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand" data-testid="brand-home">
          <span className="brand-mark" aria-hidden="true">H</span>
          <span className="brand-name">Harborview Family Clinic</span>
        </Link>
        <nav className="nav" aria-label="Main">
          {link("/", "Find a clinician", "nav-find")}
          {link("/services", "Services and fees", "nav-services")}
          {link("/appointments", "My appointments", "nav-appointments")}
          {session?.user?.role === "staff" && link("/admin", "Staff", "nav-admin")}
          {session ? (
            <button className="linkish" data-testid="nav-logout" onClick={() => { clearSession(); router.push("/"); }}>
              Log out {session.user?.name ? `(${session.user.name.split(" ")[0]})` : ""}
            </button>
          ) : (
            link("/login", "Log in", "nav-login")
          )}
        </nav>
      </div>
    </header>
  );
}
