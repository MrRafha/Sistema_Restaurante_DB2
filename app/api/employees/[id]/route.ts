import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const data = await req.json();
  const { name, role, salary, hiredAt, username, password } = data;

  const validRoles = ["ADMIN", "GARCOM", "COZINHEIRO"];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Cargo inválido." }, { status: 400 });
  }

  if (username) {
    const existing = await prisma.employee.findUnique({ where: { username } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Usuário já existe." }, { status: 409 });
    }
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      name,
      role,
      salary: salary !== undefined ? Number(salary) : undefined,
      hiredAt: hiredAt ? new Date(hiredAt) : undefined,
      username: username !== undefined ? (username || null) : undefined,
      // só atualiza senha se um valor foi fornecido
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    },
  });

  const { passwordHash: _, ...safe } = employee;
  return NextResponse.json(safe);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  await prisma.employee.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
