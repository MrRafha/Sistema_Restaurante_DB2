"use client";

import { useEffect, useState } from "react";

type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: { name: string } | null;
};

type CartItem = { dish: Dish; qty: number };

type Step = "cardapio" | "carrinho" | "dados" | "confirmado";

export function CardapioPedido() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("cardapio");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/dishes?active=true")
      .then((r) => r.json())
      .then(setDishes)
      .finally(() => setLoading(false));
  }, []);

  function addToCart(dish: Dish) {
    setCart((prev) => {
      const existing = prev.find((i) => i.dish.id === dish.id);
      if (existing) return prev.map((i) => i.dish.id === dish.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { dish, qty: 1 }];
    });
  }

  function removeFromCart(dishId: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.dish.id === dishId);
      if (!existing) return prev;
      if (existing.qty === 1) return prev.filter((i) => i.dish.id !== dishId);
      return prev.map((i) => i.dish.id === dishId ? { ...i, qty: i.qty - 1 } : i);
    });
  }

  function getQty(dishId: number) {
    return cart.find((i) => i.dish.id === dishId)?.qty ?? 0;
  }

  const total = cart.reduce((s, i) => s + i.dish.price * i.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  async function submitOrder() {
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "ONLINE",
          customerName: form.name.trim(),
          customerPhone: form.phone.replace(/\D/g, ""),
          deliveryStreet: form.street.trim(),
          deliveryNumber: form.number.trim(),
          deliveryComplement: form.complement.trim(),
          deliveryNeighborhood: form.neighborhood.trim(),
          notes: form.notes.trim(),
          items: cart.map((i) => ({ dishId: i.dish.id, quantity: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar pedido");
      setOrderId(data.id);
      setStep("confirmado");

      const codigo = data.codigo ?? `#${data.id}`;
      const linhasItens = cart
        .map((i) => `• ${i.qty}x ${i.dish.name} — R$ ${(i.dish.price * i.qty).toFixed(2).replace(".", ",")}`)
        .join("\n");
      const endereco = [form.street.trim(), form.number.trim(), form.complement.trim(), form.neighborhood.trim()]
        .filter(Boolean).join(", ");
      const msg = [
        `🍣 *SURAMU SUSHI — Novo Pedido*`,
        `📋 Pedido *${codigo}*`,
        ``,
        `*ITENS:*`,
        linhasItens,
        ``,
        `💰 *Total: R$ ${total.toFixed(2).replace(".", ",")}*`,
        ``,
        `📦 *Tipo:* Delivery`,
        `👤 *Nome:* ${form.name.trim()}`,
        `📍 *Endereço:* ${endereco}`,
        form.notes.trim() ? `📝 *Obs:* ${form.notes.trim()}` : null,
        ``,
        `_Aguardando confirmação do restaurante_ 🤙`,
      ].filter((l) => l !== null).join("\n");

      const wpp = process.env.NEXT_PUBLIC_WPP_NUMBER ?? "5511999999999";
      window.open(`https://wa.me/${wpp}?text=${encodeURIComponent(msg)}`, "_blank");

      setCart([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setSending(false);
    }
  }

  /* ── TELA: CONFIRMADO ── */
  if (step === "confirmado") {
    return (
      <div className="pk-pedido-confirmado">
        <div className="pk-display pk-confirmado-titulo">PEDIDO<br />RECEBIDO.</div>
        <div className="pk-mono pk-confirmado-num">PEDIDO #{orderId}</div>
        <p className="pk-body pk-confirmado-txt">
          Seu pedido foi enviado. Em breve entraremos em contato pelo WhatsApp para confirmar e combinar a entrega.
        </p>
        <button
          className="pk-btn-primary"
          style={{ marginTop: 32, padding: "16px 40px" }}
          onClick={() => { setStep("cardapio"); setForm({ name: "", phone: "", street: "", number: "", complement: "", neighborhood: "", notes: "" }); }}
        >
          FAZER NOVO PEDIDO
        </button>
      </div>
    );
  }

  /* ── TELA: DADOS DO CLIENTE ── */
  if (step === "dados") {
    return (
      <div className="pk-pedido-form">
        <div className="pk-pedido-form-header">
          <button className="pk-back-btn" onClick={() => setStep("carrinho")}>← VOLTAR</button>
          <div className="pk-display pk-pedido-form-titulo">ENTREGA</div>
        </div>

        <div className="pk-form-resumo">
          <div className="pk-mono pk-gray pk-form-resumo-label">RESUMO DO PEDIDO</div>
          {cart.map((i) => (
            <div key={i.dish.id} className="pk-form-resumo-item">
              <span className="pk-display pk-form-resumo-nome">{i.qty}× {i.dish.name}</span>
              <span className="pk-display pk-form-resumo-preco">R$ {(i.dish.price * i.qty).toFixed(2).replace(".", ",")}</span>
            </div>
          ))}
          <div className="pk-form-resumo-total">
            <span className="pk-display">TOTAL</span>
            <span className="pk-display pk-red">R$ {total.toFixed(2).replace(".", ",")}</span>
          </div>
        </div>

        <div className="pk-form-fields">
          <div className="pk-form-group">
            <label className="pk-mono pk-gray">NOME COMPLETO</label>
            <input className="pk-input" placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="pk-form-group">
            <label className="pk-mono pk-gray">TELEFONE / WHATSAPP</label>
            <input className="pk-input" placeholder="(11) 9 0000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="pk-form-group pk-form-group-2col">
            <div>
              <label className="pk-mono pk-gray">RUA</label>
              <input className="pk-input" placeholder="Rua..." value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            </div>
            <div>
              <label className="pk-mono pk-gray">NÚMERO</label>
              <input className="pk-input" placeholder="000" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </div>
          </div>
          <div className="pk-form-group">
            <label className="pk-mono pk-gray">COMPLEMENTO</label>
            <input className="pk-input" placeholder="Apto, bloco... (opcional)" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
          </div>
          <div className="pk-form-group">
            <label className="pk-mono pk-gray">BAIRRO</label>
            <input className="pk-input" placeholder="Bairro" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
          </div>
          <div className="pk-form-group">
            <label className="pk-mono pk-gray">OBSERVAÇÕES</label>
            <textarea className="pk-input pk-textarea" placeholder="Alguma observação? (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        {error && <div className="pk-form-error">{error}</div>}

        <button
          className="pk-btn-primary pk-full"
          style={{ marginTop: 24 }}
          onClick={submitOrder}
          disabled={sending || !form.name || !form.phone || !form.street || !form.number || !form.neighborhood}
        >
          {sending ? "ENVIANDO..." : "CONFIRMAR PEDIDO →"}
        </button>
      </div>
    );
  }

  /* ── TELA: CARRINHO ── */
  if (step === "carrinho") {
    return (
      <div className="pk-carrinho">
        <div className="pk-carrinho-header">
          <button className="pk-back-btn" onClick={() => setStep("cardapio")}>← CARDÁPIO</button>
          <div className="pk-display pk-carrinho-titulo">CARRINHO</div>
        </div>

        {cart.length === 0 ? (
          <div className="pk-carrinho-vazio">
            <div className="pk-display" style={{ fontSize: 48 }}>VAZIO.</div>
            <p className="pk-mono pk-gray">adicione itens do cardápio</p>
          </div>
        ) : (
          <>
            <div className="pk-carrinho-items">
              {cart.map((item) => (
                <div key={item.dish.id} className="pk-carrinho-item">
                  <div className="pk-carrinho-item-info">
                    <div className="pk-display pk-carrinho-item-nome">{item.dish.name}</div>
                    <div className="pk-mono pk-gray">R$ {item.dish.price.toFixed(2).replace(".", ",")} / un.</div>
                  </div>
                  <div className="pk-qty-controls">
                    <button className="pk-qty-btn" onClick={() => removeFromCart(item.dish.id)}>−</button>
                    <span className="pk-display pk-qty-num">{item.qty}</span>
                    <button className="pk-qty-btn" onClick={() => addToCart(item.dish)}>+</button>
                  </div>
                  <div className="pk-display pk-carrinho-item-subtotal pk-red">
                    R$ {(item.dish.price * item.qty).toFixed(2).replace(".", ",")}
                  </div>
                </div>
              ))}
            </div>

            <div className="pk-carrinho-total">
              <span className="pk-display">TOTAL</span>
              <span className="pk-display pk-red" style={{ fontSize: 48 }}>R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>

            <button className="pk-btn-primary pk-full" style={{ marginTop: 20 }} onClick={() => setStep("dados")}>
              CONTINUAR → ENTREGA
            </button>
          </>
        )}
      </div>
    );
  }

  /* ── TELA: CARDÁPIO ── */
  return (
    <div className="pk-cardapio-wrap">
      {/* header */}
      <div className="pk-cardapio-top">
        <div className="pk-display pk-cardapio-titulo">★★★ CARDÁPIO ★★★</div>
        {totalItems > 0 && (
          <button className="pk-carrinho-badge" onClick={() => setStep("carrinho")}>
            <span className="pk-display pk-carrinho-badge-txt">CARRINHO</span>
            <span className="pk-display pk-carrinho-badge-num">{totalItems}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="pk-mono pk-gray" style={{ padding: "40px 18px" }}>CARREGANDO...</div>
      ) : (
        <>
          {/* mobile: scroll horizontal / desktop: grid */}
          <div className="pk-cards-scroll">
            {dishes.map((dish, i) => {
              const qty = getQty(dish.id);
              return (
                <div key={dish.id} className="pk-card">
                  <div className="pk-mono pk-gray pk-card-sub">
                    {dish.category?.name ?? "ESPECIAL"}
                  </div>
                  <div className="pk-display pk-card-name">{dish.name}</div>
                  {dish.description && (
                    <div className="pk-body pk-card-desc">{dish.description}</div>
                  )}
                  <div className="pk-card-bottom">
                    <div className="pk-display pk-card-price-inline">
                      R$ {dish.price.toFixed(2).replace(".", ",")}
                    </div>
                    {qty === 0 ? (
                      <button className="pk-card-add-btn" onClick={() => addToCart(dish)}>
                        + ADICIONAR
                      </button>
                    ) : (
                      <div className="pk-card-qty-row">
                        <button className="pk-qty-btn pk-qty-btn-sm" onClick={() => removeFromCart(dish.id)}>−</button>
                        <span className="pk-display pk-qty-num-sm">{qty}</span>
                        <button className="pk-qty-btn pk-qty-btn-sm" onClick={() => addToCart(dish)}>+</button>
                      </div>
                    )}
                  </div>
                  {i === 0 && <div className="pk-card-tape">★ TOP</div>}
                </div>
              );
            })}

            {/* peixe do dia */}
            <div className="pk-card pk-card-peixe">
              <div className="pk-mono" style={{ color: "var(--pk-red)", marginBottom: 6 }}>PEIXE-DO-DIA ↓</div>
              <div className="pk-display" style={{ fontSize: 38, lineHeight: 0.9 }}>OLHETE</div>
              <div className="pk-mono pk-gray" style={{ marginTop: 6, fontSize: 9 }}>S. LALANDI · ILHABELA</div>
            </div>
          </div>

          <div className="pk-mono pk-gray pk-scroll-hint">← DESLIZE →</div>

          {/* CTA flutuante quando há itens no carrinho */}
          {totalItems > 0 && (
            <div className="pk-cardapio-cta-bar">
              <span className="pk-mono pk-gray">{totalItems} item(s) · R$ {total.toFixed(2).replace(".", ",")}</span>
              <button className="pk-btn-primary" style={{ padding: "14px 32px" }} onClick={() => setStep("carrinho")}>
                VER CARRINHO ({totalItems}) →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
