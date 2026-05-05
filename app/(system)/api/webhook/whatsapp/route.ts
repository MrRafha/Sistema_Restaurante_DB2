import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/app/generated/prisma";

const COMANDO_RE = /^(CONFIRMAR|CANCELAR|PRONTO)\s+#([A-Z0-9]+)/i;

const STATUS_MAP: Record<string, OrderStatus> = {
  CONFIRMAR: "EM_PREPARO",
  CANCELAR:  "CANCELADO",
  PRONTO:    "ENTREGUE",
};

const MENSAGEM_MAP: Record<string, string> = {
  CONFIRMAR: "✅ Pedido confirmado! Tempo estimado: 40min 🍣",
  CANCELAR:  "❌ Pedido cancelado pelo restaurante. Entre em contato.",
  PRONTO:    "🛵 Seu pedido saiu para entrega!",
};

async function enviarMensagem(telefone: string, texto: string) {
  const url  = process.env.EVOLUTION_API_URL;
  const key  = process.env.EVOLUTION_API_KEY;
  const inst = process.env.EVOLUTION_INSTANCE;
  if (!url || !key || !inst) return;

  await fetch(`${url}/message/sendText/${inst}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ number: telefone, text: texto }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Estrutura da Evolution API: body.data.message.conversation
    const texto: string =
      body?.data?.message?.conversation ??
      body?.data?.message?.extendedTextMessage?.text ??
      "";

    const match = texto.trim().match(COMANDO_RE);
    if (!match) return NextResponse.json({ ok: true }); // ignora mensagens sem comando

    const [, comando, codigo] = match;
    const novoStatus = STATUS_MAP[comando.toUpperCase()];

    const order = await prisma.order.findUnique({
      where: { codigo: codigo.toUpperCase() },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json({ error: `Pedido #${codigo} não encontrado` }, { status: 404 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: novoStatus },
    });

    if (order.customer?.phone) {
      const mensagem = MENSAGEM_MAP[comando.toUpperCase()];
      await enviarMensagem(order.customer.phone, mensagem);
    }

    return NextResponse.json({ ok: true, codigo, status: novoStatus });
  } catch (error) {
    console.error("[webhook/whatsapp]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
