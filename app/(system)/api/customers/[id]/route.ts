import { NextRequest, NextResponse } from "next/server";
import { deleteCustomer, getCustomer, updateCustomer } from "@/services/customerService";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const customer = await getCustomer(Number(id));
    if (!customer) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar cliente" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();

    const customer = await updateCustomer(Number(id), {
      ...(body.name !== undefined && { name: String(body.name) }),
      ...(body.phone !== undefined && { phone: String(body.phone) }),
      ...(body.cpf !== undefined && { cpf: body.cpf === null ? null : String(body.cpf) }),
      ...(body.email !== undefined && { email: body.email === null ? null : String(body.email) }),
    });

    return NextResponse.json(customer);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar cliente";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await deleteCustomer(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao remover cliente";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
