"use client";
import { useEffect, useState } from "react";

interface ReportResponse {
  period: number;
  start: string;
  end: string;
  revenue: number;
  totalExpenses: number;
  totalPayroll: number;
  net: number;
}

const periods = [7, 15, 30];

export default function ReportPage() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/report?period=${period}`);
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
      <h1 className="text-2xl font-bold mb-4">Relatório Financeiro</h1>
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
            <tbody>
              <tr>
                <td className="border px-2 py-1">Faturamento</td>
                <td className="border px-2 py-1 font-bold">R$ {data.revenue.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Despesas</td>
                <td className="border px-2 py-1 font-bold">R$ {data.totalExpenses.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Folha de Pagamento</td>
                <td className="border px-2 py-1 font-bold">R$ {data.totalPayroll.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Resultado Líquido</td>
                <td className={`border px-2 py-1 font-bold ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {data.net.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        <div>Nenhum dado encontrado.</div>
      )}
    </div>
  );
}
