"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
  CHANNEL_LABELS,
  formatCurrency,
  formatDate,
} from "@/lib/constants";
import { RefreshCw } from "lucide-react";

type OrderStatus = "RECEBIDO" | "EM_PREPARO" | "PRONTO" | "ENTREGUE" | "CANCELADO";
interface Dish { id: number; name: string; }
interface OrderItem { id: number; quantity: number; unitPrice: number; subtotal: number; dish: Dish; }
interface RestaurantTable { id: number; label: string; }
interface Order {
  id: number;
  status: OrderStatus;
  channel: "ONLINE" | "DINE_IN" | "TAKEAWAY";
  totalAmount: number;
  createdAt: string;
  table: RestaurantTable | null;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const cancelOrder = async (id: number) => {
    if (!confirm("Cancelar este pedido?")) return;
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    await fetchOrders();
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500">{orders.length} pedido(s)</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Nenhum pedido.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-gray-400">#{order.id}</TableCell>
                    <TableCell className="text-sm">{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="text-sm">{CHANNEL_LABELS[order.channel]}</TableCell>
                    <TableCell className="text-sm">{order.table?.label ?? "—"}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Pedido #{order.id}</DialogTitle>
                            </DialogHeader>
                            {selectedOrder?.id === order.id && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-gray-500">Canal</p>
                                    <p className="font-medium">{CHANNEL_LABELS[order.channel]}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Mesa</p>
                                    <p className="font-medium">{order.table?.label ?? "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Status</p>
                                    <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                                      {ORDER_STATUS_LABELS[order.status]}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Data</p>
                                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm font-semibold mb-2">Itens</p>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-left text-gray-500 border-b">
                                        <th className="pb-1">Prato</th>
                                        <th className="pb-1 text-right">Qtd</th>
                                        <th className="pb-1 text-right">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.items.map((item) => (
                                        <tr key={item.id} className="border-b last:border-0">
                                          <td className="py-1">{item.dish.name}</td>
                                          <td className="py-1 text-right">{item.quantity}</td>
                                          <td className="py-1 text-right">{formatCurrency(item.subtotal)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr>
                                        <td colSpan={2} className="pt-2 font-semibold">Total</td>
                                        <td className="pt-2 text-right font-bold">{formatCurrency(order.totalAmount)}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>

                                {!["ENTREGUE", "CANCELADO"].includes(order.status) && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => cancelOrder(order.id)}
                                  >
                                    Cancelar Pedido
                                  </Button>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
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
