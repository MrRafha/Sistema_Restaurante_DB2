import { prisma } from "@/lib/prisma";
import { validateBrazilianPhone } from "@/lib/validatePhone";

export interface CreateCustomerInput {
  name: string;
  phone: string;
  cpf?: string;
  email?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  cpf?: string | null;
  email?: string | null;
}

export async function listCustomers() {
  return prisma.customer.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getCustomer(id: number) {
  return prisma.customer.findUnique({
    where: { id },
  });
}

export async function createCustomer(data: CreateCustomerInput) {
  const phoneResult = validateBrazilianPhone(data.phone);
  if (!phoneResult.valid) {
    throw new Error(phoneResult.error ?? "Telefone inválido.");
  }

  const existing = await prisma.customer.findUnique({
    where: { phone: phoneResult.normalized },
  });
  if (existing) {
    throw new Error("Já existe um cliente cadastrado com este número de telefone.");
  }

  return prisma.customer.create({
    data: {
      name: data.name.trim(),
      phone: phoneResult.normalized,
      cpf: data.cpf,
      email: data.email,
    },
  });
}

export async function updateCustomer(id: number, data: UpdateCustomerInput) {
  if (data.phone !== undefined) {
    const phoneResult = validateBrazilianPhone(data.phone);
    if (!phoneResult.valid) {
      throw new Error(phoneResult.error ?? "Telefone inválido.");
    }

    const existing = await prisma.customer.findUnique({
      where: { phone: phoneResult.normalized },
    });
    if (existing && existing.id !== id) {
      throw new Error("Já existe um cliente cadastrado com este número de telefone.");
    }

    data = { ...data, phone: phoneResult.normalized };
  }

  return prisma.customer.update({
    where: { id },
    data,
  });
}

export async function deleteCustomer(id: number) {
  return prisma.customer.delete({
    where: { id },
  });
}

/**
 * Busca um cliente pelo telefone normalizado.
 * Retorna null se não encontrado.
 */
export async function findCustomerByPhone(phone: string) {
  const phoneResult = validateBrazilianPhone(phone);
  if (!phoneResult.valid) {
    throw new Error(phoneResult.error ?? "Telefone inválido.");
  }
  return prisma.customer.findUnique({
    where: { phone: phoneResult.normalized },
  });
}

/**
 * Busca cliente pelo telefone; cadastra automaticamente se não existir.
 * Incrementa orderCount ao final.
 * Retorna o cliente (existente ou recém-criado) e se foi criado agora.
 */
export async function findOrCreateCustomer(
  phone: string,
  name: string
): Promise<{ customer: Awaited<ReturnType<typeof prisma.customer.findUniqueOrThrow>>; created: boolean }> {
  const phoneResult = validateBrazilianPhone(phone);
  if (!phoneResult.valid) {
    throw new Error(phoneResult.error ?? "Telefone inválido.");
  }

  const existing = await prisma.customer.findUnique({
    where: { phone: phoneResult.normalized },
  });

  if (existing) {
    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: { orderCount: { increment: 1 } },
    });
    return { customer: updated, created: false };
  }

  const created = await prisma.customer.create({
    data: {
      name: name.trim(),
      phone: phoneResult.normalized,
      orderCount: 1,
    },
  });
  return { customer: created, created: true };
}
