import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, Table2, ShoppingBag, LogOut, Users } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
          <p className="text-sm text-gray-500">Gerencie o restaurante</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" formAction="/api/auth/logout" asChild>
            <Link href="/api/auth/logout">
              <LogOut className="h-4 w-4" />
              Sair
            </Link>
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <ChefHat className="h-8 w-8 text-orange-500 mb-2" />
            <CardTitle>Pratos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500">
              Cadastre e gerencie os pratos do cardápio, ajuste estoque e disponibilidade.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/dishes">Gerenciar Pratos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <Table2 className="h-8 w-8 text-orange-500 mb-2" />
            <CardTitle>Mesas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500">
              Cadastre e visualize as mesas do salão.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/tables">Gerenciar Mesas</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <ShoppingBag className="h-8 w-8 text-orange-500 mb-2" />
            <CardTitle>Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500">
              Histórico completo de pedidos, incluindo cancelados e entregues.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/orders">Ver Pedidos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <Users className="h-8 w-8 text-orange-500 mb-2" />
            <CardTitle>Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500">
              Cadastre, edite e remova clientes para acompanhar historico de pedidos.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/customers">Gerenciar Clientes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
