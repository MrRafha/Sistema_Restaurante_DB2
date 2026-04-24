"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, CHANNEL_LABELS, ORDER_STATUS_LABELS } from "@/lib/constants";

interface OrderItem {
  id: number;
  quantity: number;
  subtotal: number;
  dish: { name: string };
}

interface Order {
  id: number;
  status: string;
  channel: string;
  totalAmount: number;
  notes?: string | null;
  items: OrderItem[];
}

export default function RetiradaConfirmacaoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24 text-gray-500">Carregando...</div>}>
      <ConfirmacaoContent />
    </Suspense>
  );
}

function ConfirmacaoContent() {
  const params = useSearchParams();
  const orderId = params.get("id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => setOrder(data))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-500">Carregando...</div>;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500">Pedido não encontrado.</p>
        <Button asChild><Link href="/retirada">Novo pedido</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle className="mx-auto h-14 w-14 text-green-500" />
        <h1 className="text-2xl font-bold text-gray-900">Pedido enviado!</h1>
        <p className="text-gray-500">Retire no balcão quando estiver pronto.</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Pedido</span>
            <span className="font-bold text-lg">#{order.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Canal</span>
            <span className="font-medium">{CHANNEL_LABELS[order.channel as keyof typeof CHANNEL_LABELS]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Status</span>
            <Badge variant="default" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
            </Badge>
          </div>

          {order.notes && (
            <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
              <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-600 mb-0.5">Observações</p>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            </div>
          )}

          <div className="border-t pt-3 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.quantity}x {item.dish.name}</span>
                <span className="font-medium">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-orange-600">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button asChild className="w-full">
        <Link href="/retirada">Fazer outro pedido</Link>
      </Button>
    </div>
  );
}
