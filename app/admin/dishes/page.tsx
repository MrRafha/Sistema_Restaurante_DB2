"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, ToggleLeft, ToggleRight, Minus, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  isAvailable: boolean;
  qtyAvailable: number;
}

export default function AdminDishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchDishes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dishes");
      setDishes(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDishes(); }, [fetchDishes]);

  const toggleActive = async (id: number) => {
    setActionId(id);
    await fetch(`/api/dishes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-active" }),
    });
    await fetchDishes();
    setActionId(null);
  };

  const adjustStock = async (id: number, delta: number) => {
    setActionId(id);
    await fetch(`/api/dishes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "adjust-stock", delta }),
    });
    await fetchDishes();
    setActionId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pratos</h1>
          <p className="text-sm text-gray-500">{dishes.length} prato(s) cadastrado(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDishes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/dishes/new">
              <Plus className="h-4 w-4" />
              Novo Prato
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {dishes.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              Nenhum prato cadastrado.{" "}
              <Link href="/admin/dishes/new" className="text-orange-600 underline">
                Criar o primeiro prato
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Disponível</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[140px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dishes.map((dish) => (
                  <TableRow key={dish.id}>
                    <TableCell>
                      <p className="font-medium">{dish.name}</p>
                      {dish.description && (
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{dish.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(dish.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => adjustStock(dish.id, -1)}
                          disabled={actionId === dish.id || dish.qtyAvailable === 0}
                          className="rounded p-0.5 hover:bg-gray-100 disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {dish.qtyAvailable}
                        </span>
                        <button
                          onClick={() => adjustStock(dish.id, 1)}
                          disabled={actionId === dish.id}
                          className="rounded p-0.5 hover:bg-gray-100 disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={dish.isAvailable && dish.qtyAvailable > 0 ? "success" : "secondary"}>
                        {dish.isAvailable && dish.qtyAvailable > 0 ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={dish.isActive ? "default" : "outline"}>
                        {dish.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/dishes/${dish.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={actionId === dish.id}
                          onClick={() => toggleActive(dish.id)}
                          title={dish.isActive ? "Desativar" : "Ativar"}
                        >
                          {dish.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
