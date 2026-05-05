import { CardapioPedido } from "@/components/cardapio-pedido";
import { Fish3D } from "@/components/fish-3d";

const HORARIOS = [
  { dia: "DOM", ativo: false },
  { dia: "SEG", ativo: false },
  { dia: "TER", ativo: true },
  { dia: "QUA", ativo: true },
  { dia: "QUI", ativo: true },
  { dia: "SEX", ativo: true },
  { dia: "SÁB", ativo: true },
];

const CHEF_BIO_CURTA =
  "Luiz Eugênio. 10+ anos de cozinha japonesa. Construiu o Suramu na contramão: peixe endêmico, técnica autodidata, número de pedidos limitado por dia. O peixe é selecionado de manhã no Ceagesp e limpo inteiro à mão.";

export default function LandingPage() {
  return (
    <div className="pk-root">

      {/* ══════════════════════════════════════════
          DESKTOP NAV
      ══════════════════════════════════════════ */}
      <div className="pk-nav">
        <div className="pk-nav-left">
          <span className="pk-nav-logo">SURAMU</span>
        </div>
        <div className="pk-nav-links">
          <span>★ MANIFESTO</span>
          <span>★ CARDÁPIO</span>
          <span>★ CHEF</span>
          <a href="#pedir">★ PEDIR</a>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          HERO — "NÃO TRABALHAMOS COM SALMÃO."
      ══════════════════════════════════════════ */}
      <section className="pk-hero">
        {/* mobile: apenas header de 2 colunas */}
        <div className="pk-hero-mobile-header">
          <span className="pk-mono pk-gray">SURAMU SUSHI</span>
          <span className="pk-mono pk-gray">≡</span>
        </div>

        {/* grid desktop: h1 esquerda | foto + ctas direita */}
        <div className="pk-hero-grid">
          <h1 className="pk-h1">
            <span className="pk-h1-line">NÃO</span>
            <span className="pk-h1-line pk-h1-trabalhamos pk-red">TRABALHAMOS</span>
            <span className="pk-h1-line">COM</span>
            <span className="pk-h1-line pk-outline">SALMÃO.</span>
          </h1>

          <div className="pk-hero-right">
            <Fish3D className="pk-hero-fish" />
            <div className="pk-hero-cta-block">
              <div className="pk-mono pk-paper pk-tagline-center">
                ★ PEIXE DE VERDADE / DELIVERY DE QUEBRADA ★
              </div>
              <a href="https://wa.me/5511999999999" className="pk-btn-primary pk-full" target="_blank" rel="noopener noreferrer">
                WHATSAPP →
              </a>
              <a href="#cardapio" className="pk-btn-ghost pk-full" style={{ marginTop: 8 }}>
                iFood
              </a>
            </div>
          </div>
        </div>

        {/* mobile: tagline abaixo do h1 */}
        <div className="pk-hero-mobile-tagline">
          <div className="pk-rule" />
          <div className="pk-mono pk-paper">★ PEIXE DE VERDADE / DELIVERY DE QUEBRADA ★</div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MANIFESTO
      ══════════════════════════════════════════ */}
      <section className="pk-manifesto">
        <div className="pk-manifesto-grid">
          <div className="pk-display pk-manifesto-h2">
            PEIXES<br />ENDÊMICOS<b/><br/>
            <span className="pk-red">SEM CREAM CHEESE.</span>
          </div>
          <p className="pk-body pk-manifesto-p">
            Robalo. Badejo. Olhete. Cavala. Anchova. Dourado. O que o mar entrega na semana é o que vai pra mesa. Selecionado de manhã no Ceagesp. Cortado à mão. Pedido limitado por dia.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CARDÁPIO + PEDIDO
      ══════════════════════════════════════════ */}
      <section id="cardapio" className="pk-cardapio">
        <CardapioPedido />
      </section>

      {/* ══════════════════════════════════════════
          PEIXE DO DIA
      ══════════════════════════════════════════ */}
      <section className="pk-peixe-dia">
        <div className="pk-mono" style={{ marginBottom: 4 }}>★ PEIXE-DO-DIA ★</div>
        <div className="pk-display pk-peixe-nome">OLHETE</div>
        <div className="pk-body pk-italic" style={{ marginTop: 8 }}>
          Seriola lalandi · Ilhabela · {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase()}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CHEF + HORÁRIOS
      ══════════════════════════════════════════ */}
      <section id="chef" className="pk-chef">
        <div className="pk-chef-grid">
          {/* esquerda: nome + foto */}
          <div className="pk-chef-left">
            <div className="pk-display pk-chef-nome">LUIZ<br />EUGÊNIO</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/chefe.avif" alt="Chef Luiz Eugênio" className="pk-chef-foto" />
          </div>

          {/* direita: bio + horários */}
          <div className="pk-chef-right">
            <div className="pk-mono pk-red pk-chef-label">★ O CHEF ★</div>
            <p className="pk-body pk-chef-bio">{CHEF_BIO_CURTA}</p>

            <div className="pk-display pk-horarios-titulo">HORÁRIOS</div>
            <div className="pk-horarios-grid">
              {HORARIOS.map((h) => (
                <div
                  key={h.dia}
                  className={`pk-dia ${h.ativo ? "pk-dia-on" : "pk-dia-off"}`}
                >
                  {h.dia}
                </div>
              ))}
            </div>
            <div className="pk-mono pk-paper pk-horarios-label">
              TER–SÁB · 18h–22h
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STICKY CTA — mobile only
      ══════════════════════════════════════════ */}
      <div id="pedir" className="pk-sticky-cta">
        <a href="https://wa.me/5511999999999" className="pk-btn-primary pk-flex2" target="_blank" rel="noopener noreferrer">
          PEDIR / WHATSAPP →
        </a>
        <a href="#cardapio" className="pk-btn-ghost">iFood</a>
      </div>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="pk-footer">
        <span className="pk-mono pk-gray">
          © SURAMU SUSHI · ZN/SP · {new Date().getFullYear()} · PEIXE DA COSTA BRASILEIRA
        </span>
        <a href="/admin/login" className="pk-mono pk-gray pk-footer-admin">ADMIN</a>
      </footer>
    </div>
  );
}
