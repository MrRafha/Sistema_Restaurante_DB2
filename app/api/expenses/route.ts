import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Listar todas as despesas
export async function GET() {
  const expenses = await prisma.expense.findMany({ orderBy: { paidAt: 'desc' } });
  return NextResponse.json(expenses);
}

// POST: Adicionar nova despesa
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { description, value, category, paidAt } = data;
  if (!description || !value || !category) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
  }
  const expense = await prisma.expense.create({
    data: {
      description,
      value: Number(value),
      category,
      paidAt: paidAt ? new Date(paidAt) : undefined,
    },
  });
  return NextResponse.json(expense, { status: 201 });
}
