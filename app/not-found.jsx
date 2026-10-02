import Link from "next/link";
export default function NotFound() {
  return (
    <div className="panel empty" data-testid="not-found">
      <h2>Page not found</h2>
      <p style={{ margin: "0 auto 16px" }}>The page you're looking for doesn't exist.</p>
      <Link className="btn" href="/">Find a clinician</Link>
    </div>
  );
}
