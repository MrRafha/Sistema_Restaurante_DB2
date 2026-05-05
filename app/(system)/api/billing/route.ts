import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Faturamento total, do dia, despesas, salários
export async function GET() {
  // Faturamento total
  const totalRevenue = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { status: { not: 'CANCELADO' } },
  });

  // Faturamento do dia
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dailyRevenue = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: {
      status: { not: 'CANCELADO' },
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  // Total de despesas
  const totalExpenses = await prisma.expense.aggregate({ _sum: { value: true } });

  // Total de salários
  const totalSalaries = await prisma.employee.aggregate({ _sum: { salary: true } });

  // Total de gastos por categoria
  const expensesByCategory = await prisma.expense.groupBy({
    by: ['category'],
    _sum: { value: true },
  });

  // Total de salários por cargo
  const salariesByRole = await prisma.employee.groupBy({
    by: ['role'],
    _sum: { salary: true },
  });

  return NextResponse.json({
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    dailyRevenue: dailyRevenue._sum.totalAmount || 0,
    totalExpenses: totalExpenses._sum.value || 0,
    totalSalaries: totalSalaries._sum.salary || 0,
    expensesByCategory,
    salariesByRole,
  });
}
