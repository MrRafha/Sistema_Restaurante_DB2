
"use client";
import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';

type Employee = {
  id: number;
  name: string;
  role: string;
  salary: number;
  hiredAt?: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<{ name: string; role: string; salary: string; hiredAt: string }>({ name: '', role: '', salary: '', hiredAt: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/employees').then(res => res.json()).then(setEmployees);
  }, []);

  const openEdit = (emp: Employee) => {
    setEditId(emp.id);
    setForm({ name: emp.name, role: emp.role, salary: String(emp.salary), hiredAt: emp.hiredAt ? emp.hiredAt.slice(0, 10) : '' });
    setShowModal(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ name: '', role: '', salary: '', hiredAt: '' });
    setShowModal(true);
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (editId) {
      await fetch(`/api/employees/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setShowModal(false);
    setLoading(false);
    fetch('/api/employees').then(res => res.json()).then(setEmployees);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover funcionário?')) return;
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    fetch('/api/employees').then(res => res.json()).then(setEmployees);
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Funcionários</h1>
      <div className="flex justify-end mb-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={openNew}>Adicionar Funcionário</button>
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Cargo</th>
              <th className="px-4 py-2 text-left">Salário</th>
              <th className="px-4 py-2 text-left">Admissão</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-2 text-center">Nenhum funcionário cadastrado.</td></tr>
            ) : employees.map((emp: Employee) => (
              <tr key={emp.id}>
                <td className="px-4 py-2">{emp.name}</td>
                <td className="px-4 py-2">{emp.role}</td>
                <td className="px-4 py-2">R$ {Number(emp.salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-2">{emp.hiredAt ? new Date(emp.hiredAt).toLocaleDateString('pt-BR') : ''}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button className="text-blue-600 underline" onClick={() => openEdit(emp)}>Editar</button>
                  <button className="text-red-600 underline" onClick={() => handleDelete(emp.id)}>Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal de cadastro/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editId ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Nome</label>
                <input name="name" value={form.name} onChange={handleInput} required className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Cargo</label>
                <input name="role" value={form.role} onChange={handleInput} required className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Salário (R$)</label>
                <input name="salary" type="number" step="0.01" value={form.salary} onChange={handleInput} required className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Data de Admissão</label>
                <input name="hiredAt" type="date" value={form.hiredAt} onChange={handleInput} className="w-full border rounded px-2 py-1" />
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
