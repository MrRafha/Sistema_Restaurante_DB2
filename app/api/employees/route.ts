import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Listar funcionários
export async function GET() {
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(employees);
}

// POST: Criar funcionário
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { name, role, salary, hiredAt } = data;
  if (!name || !role || !salary) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
  }
  const employee = await prisma.employee.create({
    data: {
      name,
      role,
      salary: Number(salary),
      hiredAt: hiredAt ? new Date(hiredAt) : undefined,
    },
  });
  return NextResponse.json(employee, { status: 201 });
}
