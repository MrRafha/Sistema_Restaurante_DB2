import { createHash, createHmac } from "crypto";
import { EmployeeRole } from "@/app/generated/prisma";

export const COOKIE_NAME = "session_token";
export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 horas

interface SessionData {
  employeeId: number;
  role: EmployeeRole;
}

function getSecret(): string {
  return process.env.AUTH_SECRET ?? "rest_secret_2024";
}

// Cria um token JWT-like: base64(payload).base64(assinatura)
export function createSession(employeeId: number, role: EmployeeRole): string {
  const payload = Buffer.from(JSON.stringify({ employeeId, role })).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

// Valida a assinatura e retorna os dados, ou null se inválido
export function getSession(token: string): SessionData | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = createHmac("sha256", getSecret()).update(payload).digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionData;
  } catch {
    return null;
  }
}

// Mantido por compatibilidade — o token é stateless, não há nada a destruir no servidor
export function destroySession(_token: string): void {}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password + getSecret()).digest("hex");
}
