"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
  ORDER_STATUS_NEXT,
  CHANNEL_LABELS,
  formatCurrency,
  formatDate,
} from "@/lib/constants";
import { RefreshCw } from "lucide-react";

type OrderStatus = "RECEBIDO" | "EM_PREPARO" | "PRONTO" | "ENTREGUE" | "CANCELADO";

interface Dish { id: number; name: string; }
interface OrderItem { id: number; dishId: number; quantity: number; unitPrice: number; subtotal: number; dish: Dish; }
interface Table { id: number; label: string; }
interface Order {
  id: number;
  status: OrderStatus;
  channel: "ONLINE" | "DINE_IN" | "TAKEAWAY";
  totalAmount: number;
  createdAt: string;
  table: Table | null;
  items: OrderItem[];
}

const ACTIVE_STATUSES: OrderStatus[] = ["RECEBIDO", "EM_PREPARO", "PRONTO"];

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      const active = data.filter((o: Order) => ACTIVE_STATUSES.includes(o.status));
      setOrders(active);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const advanceStatus = async (orderId: number, nextStatus: OrderStatus) => {
    setUpdating(orderId);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchOrders();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  const cancelOrder = async (orderId: number) => {
    if (!confirm("Cancelar este pedido?")) return;
    setUpdating(orderId);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      await fetchOrders();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  const grouped = ACTIVE_STATUSES.reduce((acc, status) => {
    acc[status] = orders.filter((o) => o.status === status);
    return acc;
  }, {} as Record<OrderStatus, Order[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cozinha</h1>
          <p className="text-sm text-gray-500">{orders.length} pedido(s) ativo(s)</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ACTIVE_STATUSES.map((status) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={ORDER_STATUS_VARIANT[status]} className="text-sm px-3 py-1">
                {ORDER_STATUS_LABELS[status]}
              </Badge>
              <span className="text-sm text-gray-400">({grouped[status]?.length ?? 0})</span>
            </div>

            {(grouped[status] ?? []).length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                Nenhum pedido
              </div>
            ) : (
              (grouped[status] ?? []).map((order) => {
                const nextStatus = ORDER_STATUS_NEXT[order.status];
                const isUpdating = updating === order.id;
                return (
                  <Card key={order.id} className="border-l-4" style={{
                    borderLeftColor: status === "RECEBIDO" ? "#f97316" : status === "EM_PREPARO" ? "#eab308" : "#22c55e"
                  }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                          Pedido #{order.id}
                        </CardTitle>
                        <span className="text-xs text-gray-400">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>{CHANNEL_LABELS[order.channel]}</span>
                        {order.table && <span>· Mesa {order.table.label}</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="space-y-1">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.dish.name}</span>
                            <span className="text-gray-500">{formatCurrency(item.subtotal)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-xs text-gray-400">Total</span>
                        <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="flex gap-2">
                        {nextStatus && (
                          <Button
                            size="sm"
                            className="flex-1"
                            disabled={isUpdating}
                            onClick={() => advanceStatus(order.id, nextStatus)}
                          >
                            {ORDER_STATUS_LABELS[nextStatus]} →
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isUpdating}
                          onClick={() => cancelOrder(order.id)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
