import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT: Atualizar funcionário
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await req.json();
  const { name, role, salary, hiredAt } = data;
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  const employee = await prisma.employee.update({
    where: { id },
    data: { name, role, salary: Number(salary), hiredAt: hiredAt ? new Date(hiredAt) : undefined },
  });
  return NextResponse.json(employee);
}

// DELETE: Remover funcionário
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  await prisma.employee.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
