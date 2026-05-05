"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart, Plus, Minus, Trash2, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/constants";
import { validateBrazilianPhone } from "@/lib/validatePhone";

interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  qtyAvailable: number;
}

interface Table {
  id: number;
  label: string;
  status: string;
}

interface CartItem {
  dish: Dish;
  quantity: number;
}

export default function PedidoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24 text-gray-500">Carregando...</div>}>
      <PedidoContent />
    </Suspense>
  );
}

function PedidoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesaParam = searchParams.get("mesa");

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState<string>(mesaParam ?? "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Identificação do cliente
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [foundCustomer, setFoundCustomer] = useState<{ name: string } | null | undefined>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const mesaFixa = !!mesaParam;

  const applyPhoneMask = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneBlur = useCallback(async () => {
    const validation = validateBrazilianPhone(customerPhone);
    if (!validation.valid) {
      setPhoneError(validation.error ?? "Telefone inválido.");
      setFoundCustomer(null);
      return;
    }
    setPhoneError(null);
    setLookingUp(true);
    try {
      const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(validation.normalized)}`);
      if (res.ok) {
        const data = await res.json();
        setFoundCustomer(data);
        setCustomerName(data.name);
      } else {
        setFoundCustomer(undefined);
      }
    } catch {
      setFoundCustomer(undefined);
    } finally {
      setLookingUp(false);
    }
  }, [customerPhone]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dishRes, tableRes] = await Promise.all([
        fetch("/api/dishes?active=true"),
        fetch("/api/tables"),
      ]);
      const dishData = await dishRes.json();
      const tableData = await tableRes.json();
      setDishes(dishData.filter((d: Dish) => d.isAvailable && d.qtyAvailable > 0));
      setTables(tableData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Se veio ?mesa=X, garantir que o tableId está setado após carregar as mesas
  useEffect(() => {
    if (mesaParam) setTableId(mesaParam);
  }, [mesaParam]);

  function addToCart(dish: Dish) {
    setCart((prev) => {
      const existing = prev.find((i) => i.dish.id === dish.id);
      if (existing) {
        if (existing.quantity >= dish.qtyAvailable) return prev;
        return prev.map((i) => i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { dish, quantity: 1 }];
    });
  }

  function removeFromCart(dishId: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.dish.id === dishId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((i) => i.dish.id !== dishId);
      return prev.map((i) => i.dish.id === dishId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  }

  function clearCart(dishId: number) {
    setCart((prev) => prev.filter((i) => i.dish.id !== dishId));
  }

  const total = cart.reduce((sum, i) => sum + i.dish.price * i.quantity, 0);
  const cartQty = (dishId: number) => cart.find((i) => i.dish.id === dishId)?.quantity ?? 0;

  // Label da mesa selecionada
  const selectedTable = tables.find((t) => String(t.id) === tableId);

  async function handleSubmit() {
    setError("");

    if (cart.length === 0) {
      setError("Adicione pelo menos um item ao pedido.");
      return;
    }
    if (!customerPhone.trim()) {
      setError("Informe o telefone.");
      return;
    }
    const phoneValidation = validateBrazilianPhone(customerPhone);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error ?? "Telefone inválido.");
      setError("Corrija o telefone.");
      return;
    }
    if (!customerName.trim()) {
      setError("Informe o nome.");
      return;
    }
    if (!tableId) {
      setError("Selecione uma mesa.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "DINE_IN",
          tableId: Number(tableId),
          items: cart.map((i) => ({ dishId: i.dish.id, quantity: i.quantity })),
          customerPhone,
          customerName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao criar pedido.");
      }

      const order = await res.json();
      router.push(`/pedido/confirmacao?id=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        Carregando cardápio...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedido — Salão</h1>
        {selectedTable ? (
          <p className="text-sm text-orange-600 font-medium">Mesa {selectedTable.label}</p>
        ) : (
          <p className="text-sm text-gray-500">Selecione uma mesa para continuar</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cardápio */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-700">Cardápio disponível</h2>
          {dishes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Nenhum prato disponível no momento.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {dishes.map((dish) => {
                const qty = cartQty(dish.id);
                return (
                  <Card key={dish.id} className={qty > 0 ? "ring-2 ring-orange-400" : ""}>
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{dish.name}</p>
                          {dish.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">{dish.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {dish.qtyAvailable} restantes
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-600">{formatCurrency(dish.price)}</span>
                        {qty === 0 ? (
                          <Button size="sm" onClick={() => addToCart(dish)}>
                            <Plus className="h-4 w-4 mr-1" />Adicionar
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => removeFromCart(dish.id)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-5 text-center font-semibold">{qty}</span>
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => addToCart(dish)} disabled={qty >= dish.qtyAvailable}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Identificação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="customerPhone">Telefone *</Label>
                <Input
                  id="customerPhone"
                  placeholder="(11) 98765-4321"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(applyPhoneMask(e.target.value));
                    setPhoneError(null);
                    setFoundCustomer(null);
                    setCustomerName("");
                  }}
                  onBlur={handlePhoneBlur}
                />
                {lookingUp && <p className="text-xs text-gray-400">Buscando cliente...</p>}
                {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
                {foundCustomer && (
                  <p className="text-xs text-green-600">Cliente encontrado: <strong>{foundCustomer.name}</strong></p>
                )}
                {foundCustomer === undefined && !lookingUp && customerPhone && !phoneError && (
                  <p className="text-xs text-blue-600">Novo cliente — será cadastrado ao enviar.</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="customerName">Nome *</Label>
                <Input
                  id="customerName"
                  placeholder="Nome do cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  readOnly={!!foundCustomer}
                  className={foundCustomer ? "bg-gray-50 text-gray-500" : ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mesa */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mesa</CardTitle>
            </CardHeader>
            <CardContent>
              {mesaFixa && selectedTable ? (
                <div className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2">
                  <span className="text-sm font-medium text-orange-700">Mesa {selectedTable.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedTable.status === "FREE" ? "Livre" : "Ocupada"}
                  </Badge>
                </div>
              ) : (
                <Select value={tableId} onValueChange={setTableId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        Mesa {t.label}
                        {t.status === "OCCUPIED" && (
                          <span className="ml-2 text-xs text-orange-500">(ocupada)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Carrinho */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Resumo do pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum item adicionado</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {cart.map((item) => (
                      <li key={item.dish.id} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate">{item.dish.name}</span>
                        <span className="text-gray-500 shrink-0">x{item.quantity}</span>
                        <span className="font-medium shrink-0">{formatCurrency(item.dish.price * item.quantity)}</span>
                        <button onClick={() => clearCart(item.dish.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">{formatCurrency(total)}</span>
                  </div>
                </>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

              <Button className="w-full" onClick={handleSubmit} disabled={submitting || cart.length === 0}>
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Enviando..." : "Enviar Pedido"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
