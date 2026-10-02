// Deterministic accounts. Tokens are stateless so any server instance can read them.
export const USERS = [
  { email: "demo@example.com", password: "password123", name: "Jordan Lee", role: "patient" },
  { email: "admin@example.com", password: "admin123", name: "Front desk", role: "staff" },
];
export const REGISTERED_EMAIL = "existing@example.com";
export const MIN_PASSWORD = 8;

export function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || ""));
}

export function makeToken(user) {
  return "hv." + Buffer.from(JSON.stringify({ email: user.email, name: user.name, role: user.role })).toString("base64url");
}

export function readToken(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token.startsWith("hv.")) return null;
  try {
    const data = JSON.parse(Buffer.from(token.slice(3), "base64url").toString("utf8"));
    return data && data.email ? data : null;
  } catch (e) {
    return null;
  }
}
