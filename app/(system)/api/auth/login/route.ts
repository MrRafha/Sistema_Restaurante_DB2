import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Usuário e senha obrigatórios" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({ where: { username } });
    if (!employee || !employee.passwordHash || employee.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: "Usuário ou senha incorretos" }, { status: 401 });
    }

    const token = createSession(employee.id, employee.role);
    const response = NextResponse.json({ success: true, role: employee.role });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erro ao autenticar" }, { status: 500 });
  }
}
