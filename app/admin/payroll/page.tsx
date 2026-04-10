"use client";
import { useEffect, useState } from "react";

interface PayrollItem {
  id: number;
  name: string;
  role: string;
  baseSalary: number;
  bonus: number;
  total: number;
}

interface PayrollResponse {
  period: number;
  start: string;
  end: string;
  payroll: PayrollItem[];
  totalPayroll: number;
}

const periods = [7, 15, 30];

export default function PayrollPage() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<PayrollResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/payroll?period=${period}`);
        const json = await res.json();
        if (!ignore) setData(json);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchData();
    return () => {
      ignore = true;
    };
  }, [period]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Folha de Pagamento</h1>
      <div className="mb-4">
        <label className="mr-2">Período:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {periods.map((p) => (
            <option key={p} value={p}>
              Últimos {p} dias
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div>Carregando...</div>
      ) : data ? (
        <>
          <div className="mb-2 text-sm text-gray-500">
            {new Date(data.start).toLocaleDateString()} até {new Date(data.end).toLocaleDateString()}
          </div>
          <table className="w-full border mb-4">
            <thead>
              <tr>
                <th className="border px-2 py-1">Nome</th>
                <th className="border px-2 py-1">Cargo</th>
                <th className="border px-2 py-1">Salário Base</th>
                <th className="border px-2 py-1">Gratificação</th>
                <th className="border px-2 py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.payroll.map((item) => (
                <tr key={item.id}>
                  <td className="border px-2 py-1">{item.name}</td>
                  <td className="border px-2 py-1">{item.role}</td>
                  <td className="border px-2 py-1">R$ {item.baseSalary.toFixed(2)}</td>
                  <td className="border px-2 py-1">R$ {item.bonus.toFixed(2)}</td>
                  <td className="border px-2 py-1 font-bold">R$ {item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="font-bold text-right">
            Total da folha: R$ {data.totalPayroll.toFixed(2)}
          </div>
        </>
      ) : (
        <div>Nenhum dado encontrado.</div>
      )}
    </div>
  );
}
