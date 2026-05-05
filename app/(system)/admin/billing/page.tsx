
"use client";
import React, { useEffect, useState } from 'react';

type Expense = {
  id: number;
  description: string;
  value: number;
  category: string;
  paidAt: string;
};

type BillingSummary = {
  totalRevenue: number;
  dailyRevenue: number;
  totalExpenses: number;
  totalSalaries: number;
  expensesByCategory: { category: string; _sum: { value: number } }[];
  salariesByRole: { role: string; _sum: { salary: number } }[];
};

export default function BillingPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ description: '', value: '', category: '', paidAt: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/expenses')
      .then(res => res.json())
      .then(setExpenses);
    fetch('/api/billing')
      .then(res => res.json())
      .then(setSummary);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ description: '', value: '', category: '', paidAt: '' });
    setShowModal(false);
    // Atualiza dados
    fetch('/api/expenses').then(res => res.json()).then(setExpenses);
    fetch('/api/billing').then(res => res.json()).then(setSummary);
    setLoading(false);
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Faturamento e Despesas</h1>
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded shadow p-4 flex flex-col justify-between h-full">
          <div>
            <div className="text-gray-500 text-sm">Faturamento Total</div>
            <div className="text-2xl font-semibold">R$ {summary ? summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--,--'}</div>
          </div>
          <button
            className="mt-4 bg-blue-600 text-white px-3 py-1 rounded text-sm w-fit"
            onClick={() => window.location.href = '/admin/report'}
          >
            Ver Relatório
          </button>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500 text-sm">Faturamento do Dia</div>
          <div className="text-2xl font-semibold">R$ {summary ? summary.dailyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--,--'}</div>
        </div>
        <div className="bg-white rounded shadow p-4 flex flex-col justify-between h-full">
          <div>
            <div className="text-gray-500 text-sm">Total de Despesas</div>
            <div className="text-2xl font-semibold">R$ {summary ? summary.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--,--'}</div>
          </div>
        </div>
      </div>

      {/* Cards extras: salários, gastos por categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded shadow p-4 flex flex-col justify-between h-full">
          <div>
            <div className="text-gray-500 text-sm">Total de Salários</div>
            <div className="text-2xl font-semibold">R$ {summary ? summary.totalSalaries.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--,--'}</div>
          </div>
          <button
            className="mt-4 bg-blue-600 text-white px-3 py-1 rounded text-sm w-fit"
            onClick={() => window.location.href = '/admin/payroll'}
          >
            Ver Folha de Pagamento
          </button>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500 text-sm">Gastos por Categoria</div>
          <ul className="text-sm mt-2">
            {summary?.expensesByCategory.map((cat) => (
              <li key={cat.category}>{cat.category}: R$ {cat._sum.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Cards extras: salários por cargo */}
      <div className="bg-white rounded shadow p-4 mb-8">
        <div className="text-gray-500 text-sm">Total pago por cargo</div>
        <ul className="text-sm mt-2">
          {summary?.salariesByRole.map((role) => (
            <li key={role.role}>{role.role}: R$ {role._sum.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
          ))}
        </ul>
      </div>

      {/* Tabela de despesas e botão para adicionar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Despesas</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowModal(true)}>Adicionar Despesa</button>
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Descrição</th>
              <th className="px-4 py-2 text-left">Categoria</th>
              <th className="px-4 py-2 text-left">Valor</th>
              <th className="px-4 py-2 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-2 text-center">Nenhuma despesa cadastrada.</td></tr>
            ) : expenses.map((exp) => (
              <tr key={exp.id}>
                <td className="px-4 py-2">{exp.description}</td>
                <td className="px-4 py-2">{exp.category}</td>
                <td className="px-4 py-2">R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-2">{new Date(exp.paidAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para adicionar despesa */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Adicionar Despesa</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Descrição</label>
                <input name="description" value={form.description} onChange={handleInput} required className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Valor (R$)</label>
                <input name="value" type="number" step="0.01" value={form.value} onChange={handleInput} required className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Categoria</label>
                <input name="category" value={form.category} onChange={handleInput} required className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Data de Pagamento</label>
                <input name="paidAt" type="date" value={form.paidAt} onChange={handleInput} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
