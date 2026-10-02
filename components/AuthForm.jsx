"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setSession } from "@/lib/client";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const signup = mode === "signup";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    setError(null); setErrors({});
    if (!signup && (!form.email || !form.password)) { setError("Enter your email and password."); return; }
    setBusy(true);
    const { status, data } = await api(signup ? "/api/auth/signup" : "/api/auth/login", { method: "POST", body: form });
    setBusy(false);
    if (status === 200 || status === 201) {
      setSession({ token: data.token, user: data.user });
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next || (data.user.role === "staff" ? "/admin" : "/appointments"));
      return;
    }
    if (data.errors) setErrors(data.errors);
    setError(data.error || "Something went wrong. Try again.");
  }

  return (
    <div className="auth">
      <h1>{signup ? "Create your account" : "Log in"}</h1>
      <p className="muted">{signup ? "Manage bookings, reschedule and get reminders." : "See and manage your appointments."}</p>
      <div className="panel">
        {error && <div className="notice error" role="alert" data-testid="auth-error">{error}</div>}
        {signup && (
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" data-testid="signup-name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} autoComplete="name" />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" data-testid={signup ? "signup-email" : "login-email"} value={form.email} onChange={set("email")} aria-invalid={!!errors.email} autoComplete={signup ? "email" : "username"} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" data-testid={signup ? "signup-password" : "login-password"} value={form.password} onChange={set("password")} aria-invalid={!!errors.password} autoComplete={signup ? "new-password" : "current-password"} />
          {signup && !errors.password && <span className="hint">At least 8 characters</span>}
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
        <button className="btn" style={{ width: "100%" }} data-testid={signup ? "signup-submit" : "login-submit"} disabled={busy} onClick={submit}>
          {busy ? "Please wait..." : signup ? "Create account" : "Log in"}
        </button>
        <p className="small muted" style={{ marginTop: 16, marginBottom: 0 }}>
          {signup ? <>Already have an account? <Link href="/login" data-testid="go-login">Log in</Link></> : <>New to Harborview? <Link href="/signup" data-testid="go-signup">Create an account</Link></>}
        </p>
      </div>
    </div>
  );
}
