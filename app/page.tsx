import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChefHat, Table2, ArrowRight } from "lucide-react";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT, formatCurrency, formatDate } from "@/lib/constants";

async function getDashboardData() {
  const [activeOrders, occupiedTables, availableDishes, recentOrders] =
    await Promise.all([
      prisma.order.count({
        where: { status: { notIn: ["ENTREGUE", "CANCELADO"] } },
      }),
      prisma.table.count({ where: { status: "OCCUPIED" } }),
      prisma.dish.count({ where: { isActive: true, isAvailable: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { table: true, items: { include: { dish: true } } },
      }),
    ]);
  return { activeOrders, occupiedTables, availableDishes, recentOrders };
}

export default async function HomePage() {
  const { activeOrders, occupiedTables, availableDishes, recentOrders } =
    await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral do restaurante</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pedidos Ativos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeOrders}</div>
            <Link href="/kitchen" className="text-xs text-orange-600 hover:underline">Ver na cozinha →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Mesas Ocupadas</CardTitle>
            <Table2 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{occupiedTables}</div>
            <Link href="/tables" className="text-xs text-orange-600 hover:underline">Ver mesas →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pratos Disponíveis</CardTitle>
            <ChefHat className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availableDishes}</div>
            <Link href="/menu" className="text-xs text-orange-600 hover:underline">Ver cardápio →</Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pedidos Recentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">Ver todos <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum pedido registrado</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400">#{order.id}</span>
                    <div>
                      <p className="text-sm font-medium">
                        {order.table ? `Mesa ${order.table.label}` : "Sem mesa"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.createdAt)} · {order.items.length} item(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <span className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button asChild variant="outline" className="h-16 flex-col gap-1">
          <Link href="/kitchen"><ChefHat className="h-5 w-5" /><span className="text-xs">Cozinha</span></Link>
        </Button>
        <Button asChild variant="outline" className="h-16 flex-col gap-1">
          <Link href="/tables"><Table2 className="h-5 w-5" /><span className="text-xs">Mesas</span></Link>
        </Button>
        <Button asChild variant="outline" className="h-16 flex-col gap-1">
          <Link href="/menu"><ShoppingBag className="h-5 w-5" /><span className="text-xs">Cardápio</span></Link>
        </Button>
        <Button asChild className="h-16 flex-col gap-1">
          <Link href="/admin"><span className="text-xs">Administração</span></Link>
        </Button>
      </div>
    </div>
  );
}

