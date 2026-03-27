"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type TableStatus = "FREE" | "OCCUPIED";

interface RestaurantTable {
  id: number;
  label: string;
  capacity: number | null;
  status: TableStatus;
}

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tables");
      const data = await res.json();
      setTables(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const toggleStatus = async (table: RestaurantTable) => {
    const newStatus: TableStatus =
      table.status === "FREE" ? "OCCUPIED" : "FREE";
    setUpdating(table.id);
    try {
      await fetch(`/api/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchTables();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  const free = tables.filter((t) => t.status === "FREE");
  const occupied = tables.filter((t) => t.status === "OCCUPIED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesas</h1>
          <p className="text-sm text-gray-500">
            {free.length} livre(s) · {occupied.length} ocupada(s)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTables} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {tables.length === 0 && !loading ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
          Nenhuma mesa cadastrada.{" "}
          <a href="/admin/tables" className="text-orange-600 underline">
            Cadastrar mesas
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {tables.map((table) => {
            const isFree = table.status === "FREE";
            const isUpdating = updating === table.id;
            return (
              <button
                key={table.id}
                disabled={isUpdating}
                onClick={() => toggleStatus(table)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all hover:shadow-md disabled:opacity-60",
                  isFree
                    ? "border-green-300 bg-green-50 hover:border-green-400"
                    : "border-red-300 bg-red-50 hover:border-red-400"
                )}
              >
                <span className="text-2xl font-bold text-gray-800">
                  {table.label}
                </span>
                {table.capacity && (
                  <span className="text-xs text-gray-400">
                    {table.capacity} lugares
                  </span>
                )}
                <Badge
                  variant={isFree ? "success" : "destructive"}
                  className="mt-2 text-xs"
                >
                  {isFree ? "Livre" : "Ocupada"}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Clique em uma mesa para alternar entre livre e ocupada. O sistema gerencia automaticamente com base nos pedidos.
      </p>
    </div>
  );
}
