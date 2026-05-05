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

// Lógica de cálculo da folha de pagamento:
// - Para cada funcionário, calcula o salário base do período
// - Adiciona a gratificação se aplicável (ex: conforme regras)
// - Retorna a lista da folha e totais

export async function GET(req: NextRequest) {
  // Lê o período da query (?period=30), padrão 30 dias
  const { searchParams } = new URL(req.url);
  const period = parseInt(searchParams.get('period') || '30', 10);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - period + 1);

  // Busca funcionários
  const employees = await prisma.employee.findMany();

  // Busca pedidos ENTREGUES para cálculo da gratificação (exclui cancelados)
  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ["CANCELADO"] },
      createdAt: {
        gte: start,
        lte: now,
      },
    },
  });

  // Gratificação: 10% do faturamento total do período, dividido igualmente entre todos os funcionários
  const totalSales = orders.reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0);
  const employeeCount = employees.length;
  const bonusPerEmployee = employeeCount > 0 ? (totalSales * 0.10) / employeeCount : 0;

  // Monta a folha de pagamento
  const payroll = employees.map((emp: Employee) => {
    const bonus = bonusPerEmployee;
    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      baseSalary: emp.salary,
      bonus,
      total: emp.salary + bonus,
    };
  });

  const totalPayroll = payroll.reduce((sum: number, p: { total: number }) => sum + p.total, 0);

  return NextResponse.json({
    period,
    start: start.toISOString(),
    end: now.toISOString(),
    payroll,
    totalPayroll,
  });
}
