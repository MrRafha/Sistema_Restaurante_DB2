import { createHash } from "crypto";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 horas

export function hashPassword(password: string): string {
  return createHash("sha256")
    .update(password + (process.env.ADMIN_PASSWORD ?? ""))
    .digest("hex");
}

export function generateSessionToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  return createHash("sha256")
    .update(password + "restaurant_session_secret")
    .digest("hex");
}

export function isValidSession(token: string): boolean {
  return token === generateSessionToken();
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
