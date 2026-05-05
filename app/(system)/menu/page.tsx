import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";

export const revalidate = 60;

async function getMenuDishes() {
  return prisma.dish.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export default async function MenuPage() {
  const dishes = await getMenuDishes();
  const available = dishes.filter((d) => d.isAvailable && d.qtyAvailable > 0);
  const unavailable = dishes.filter(
    (d) => !d.isAvailable || d.qtyAvailable === 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cardápio</h1>
        <p className="text-sm text-gray-500">
          {available.length} prato(s) disponíveis
        </p>
      </div>

      {available.length === 0 && unavailable.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhum prato cadastrado no cardápio.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((dish) => (
              <Card key={dish.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{dish.name}</CardTitle>
                    <Badge variant="success" className="shrink-0">
                      Disponível
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dish.description && (
                    <p className="text-sm text-gray-500">{dish.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-600">
                      {formatCurrency(dish.price)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {dish.qtyAvailable} disponíveis
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {unavailable.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-700">
                Indisponíveis no momento
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unavailable.map((dish) => (
                  <Card key={dish.id} className="overflow-hidden opacity-60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{dish.name}</CardTitle>
                        <Badge variant="secondary" className="shrink-0">
                          Indisponível
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {dish.description && (
                        <p className="text-sm text-gray-500">
                          {dish.description}
                        </p>
                      )}
                      <span className="text-lg font-bold text-gray-400">
                        {formatCurrency(dish.price)}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
