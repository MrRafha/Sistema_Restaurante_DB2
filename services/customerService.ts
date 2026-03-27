import { prisma } from "@/lib/prisma";

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
  return prisma.customer.create({
    data: {
      name: data.name,
      phone: data.phone,
      cpf: data.cpf,
      email: data.email,
    },
  });
}

export async function updateCustomer(id: number, data: UpdateCustomerInput) {
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
