import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true, username: true, salary: true, hiredAt: true },
  });
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { name, role, salary, hiredAt, username, password } = data;

  if (!name || !role || !salary) {
    return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
  }

  const validRoles = ["ADMIN", "GARCOM", "COZINHEIRO"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Cargo inválido." }, { status: 400 });
  }

  if (username) {
    const existing = await prisma.employee.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Usuário já existe." }, { status: 409 });
    }
  }

  const employee = await prisma.employee.create({
    data: {
      name,
      role,
      salary: Number(salary),
      hiredAt: hiredAt ? new Date(hiredAt) : undefined,
      username: username || null,
      passwordHash: password ? hashPassword(password) : null,
    },
  });

  const { passwordHash: _, ...safe } = employee;
  return NextResponse.json(safe, { status: 201 });
}
