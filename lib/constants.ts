import { OrderStatus } from "@/app/generated/prisma";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEBIDO: "Recebido",
  EM_PREPARO: "Em Preparo",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const ORDER_STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  RECEBIDO: "EM_PREPARO",
  EM_PREPARO: "PRONTO",
  PRONTO: "ENTREGUE",
};

export type OrderStatusVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info";

export const ORDER_STATUS_VARIANT: Record<OrderStatus, OrderStatusVariant> = {
  RECEBIDO: "default",
  EM_PREPARO: "warning",
  PRONTO: "success",
  ENTREGUE: "secondary",
  CANCELADO: "destructive",
};

export const CHANNEL_LABELS = {
  ONLINE: "Online",
  DINE_IN: "Salão",
  TAKEAWAY: "Para Viagem",
} as const;

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}
