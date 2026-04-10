import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Employee = {
  id: number;
  name: string;
  role: string;
  salary: number;
};
type Order = {
  totalAmount?: number;
  createdAt: Date;
};
type Expense = {
  value?: number;
  createdAt: Date;
};

// Relatório financeiro final: faturamento, despesas, folha de pagamento e resultado líquido do período
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = parseInt(searchParams.get('period') || '30', 10);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - period + 1);

  // Faturamento
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: now,
      },
    },
  });
  const revenue = orders.reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0);

  // Despesas
  const expenses = await prisma.expense.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: now,
      },
    },
  });
  const totalExpenses = expenses.reduce((sum: number, e: Expense) => sum + (e.value || 0), 0);

  // Folha de pagamento (gratificação para todos)
  const employees = await prisma.employee.findMany();
  const employeeCount = employees.length;
  const bonusPerEmployee = employeeCount > 0 ? (revenue * 0.10) / employeeCount : 0;
  const payroll = employees.map((emp: Employee) => emp.salary + bonusPerEmployee);
  const totalPayroll = payroll.reduce((sum: number, p: number) => sum + p, 0);

  // Resultado líquido
  const net = revenue - totalExpenses - totalPayroll;

  return NextResponse.json({
    period,
    start: start.toISOString(),
    end: now.toISOString(),
    revenue,
    totalExpenses,
    totalPayroll,
    net,
  });
}
