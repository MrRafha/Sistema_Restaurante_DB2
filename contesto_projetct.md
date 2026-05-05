# SURAMU SUSHI — Contexto do Projeto

## Sobre a marca

Suramu é um delivery de sushi underground da Zona Norte de São Paulo. O diferencial é não usar salmão — trabalham exclusivamente com peixes da costa brasileira. Atendem de terça a sábado das 18h às 22h, via iFood e WhatsApp. A identidade é crua, direta, de quebrada.

---

## Stack

- **Framework:** Next.js (App Router)
- **Banco de dados:** Prisma + SQLite (migrar para PostgreSQL/Supabase em produção)
- **Estilização:** CSS puro com variáveis, sem Tailwind
- **Deploy alvo:** Vercel (frontend) + Railway ou VPS (Evolution API)

---

## Identidade visual

| Token | Valor |
|---|---|
| Background | `#0a0a0a` |
| Foreground | `#f0ece4` |
| Vermelho primário | `#C8372B` |
| Muted | `#888888` |
| Border fraca | `#2a2a2a` |
| Border forte | `#f0ece4` |

**Tipografia:**
- Display / títulos / preços / botões: `Bebas Neue` weight 400
- Corpo / labels / descrições: `IBM Plex Mono` weight 400–600

**Estética:** híbrido Zine + Punk. Grid com coluna lateral de 52px, separadores de 1–2px, tipografia em caps, espaço negativo generoso, sem arredondamentos, sem sombras decorativas.

---

## Estrutura de páginas

```
/                    → Landing page (hero, manifesto, peixe do dia, cardápio resumido)
/cardapio            → Cardápio completo com carrinho
/admin               → Painel interno (pedidos, pratos, status)
```

---

## Cardápio atual (dados de exemplo)

```js
const CARDAPIO = [
  { id:1, cat:'Niguiri · 4 un', nome:'ROBALO',  desc:'Peixe branco da costa · delicado',  fish:'Centropomus undecimalis', preco:32 },
  { id:2, cat:'Niguiri · 4 un', nome:'BADEJO',  desc:'Textura firme · sabor intenso',      fish:'Mycteroperca bonaci',     preco:34 },
  { id:3, cat:'Niguiri · 4 un', nome:'OLHETE',  desc:'Peixe azul · levemente gorduroso',   fish:'Seriola lalandi',         preco:36 },
  { id:4, cat:'Sashimi · 8 fat',nome:'CAVALA',  desc:'Gordura nobre · peixe oceânico',     fish:'Scomberomorus cavalla',   preco:44 },
  { id:5, cat:'Uramaki · 6 un', nome:'ANCHOVA', desc:'Sabor marcante · maçaricado',        fish:'Pomatomus saltatrix',     preco:38 },
  { id:6, cat:'Temaki · 1 un',  nome:'DOURADO', desc:'Peixe nobre · textura suave',        fish:'Coryphaena hippurus',     preco:28 },
]
```

---

## Arquitetura de pedidos via WhatsApp

### Fluxo 1 — Pedido via site

```
Cliente monta carrinho
  → POST /api/pedidos         (salva no banco, gera ID tipo #SRU047, status: "pendente")
  → Abre wa.me/ com mensagem formatada contendo o ID
  → Restaurante recebe no WhatsApp
```

### Fluxo 2 — Bot de resposta automática

```
Restaurante digita "CONFIRMAR #SRU047" no WhatsApp
  → Evolution API dispara webhook
  → POST /api/webhook/whatsapp
  → API lê o ID, atualiza status no banco
  → Bot manda mensagem automática pro cliente
```

---

## API Routes a implementar

### `POST /api/pedidos`

Salva o pedido antes de abrir o WhatsApp.

**Body esperado:**
```json
{
  "nome": "João Silva",
  "endereco": "Rua X, 123, Bairro Y",
  "tipo": "delivery",
  "observacoes": "sem wasabi",
  "itens": [
    { "pratoId": 1, "quantidade": 2, "precoUnitario": 32 },
    { "pratoId": 4, "quantidade": 1, "precoUnitario": 44 }
  ]
}
```

**Resposta:**
```json
{
  "id": "SRU047",
  "status": "pendente",
  "total": 108,
  "criadoEm": "2024-05-03T20:14:00Z"
}
```

---

### `POST /api/webhook/whatsapp`

Recebe eventos da Evolution API. Interpreta comandos do restaurante e atualiza o banco.

**Comandos suportados:**

| Comando | Novo status | Mensagem pro cliente |
|---|---|---|
| `CONFIRMAR #SRU047` | `confirmado` | "Pedido confirmado! Tempo estimado: 40min 🍣" |
| `CANCELAR #SRU047` | `cancelado` | "Pedido cancelado pelo restaurante. Entre em contato." |
| `PRONTO #SRU047` | `saiu_para_entrega` | "Seu pedido saiu para entrega! 🛵" |

**Lógica:**
```ts
// 1. Recebe o webhook da Evolution API
// 2. Extrai o texto da mensagem
// 3. Faz regex para identificar comando + ID: /^(CONFIRMAR|CANCELAR|PRONTO)\s+#(\w+)/i
// 4. Busca o pedido no banco pelo ID
// 5. Atualiza o status
// 6. Usa a Evolution API para enviar mensagem de volta pro número do cliente
```

---

### `GET /api/pedidos`

Lista pedidos para o painel admin.

**Query params:** `?status=pendente&page=1&limit=20`

---

## Schema Prisma — modelo Pedido

```prisma
model Pedido {
  id          String   @id @default(cuid())
  codigo      String   @unique  // "SRU047"
  nome        String
  telefone    String?
  endereco    String?
  tipo        String   // "delivery" | "retirada"
  observacoes String?
  status      String   @default("pendente")
  // "pendente" | "confirmado" | "cancelado" | "saiu_para_entrega" | "entregue"
  total       Float
  itens       ItemPedido[]
  criadoEm   DateTime @default(now())
  atualizadoEm DateTime @updatedAt
}

model ItemPedido {
  id             Int    @id @default(autoincrement())
  pedidoId       String
  pedido         Pedido @relation(fields: [pedidoId], references: [id])
  pratoId        Int
  quantidade     Int
  precoUnitario  Float
}
```

---

## Geração do ID do pedido

```ts
function gerarCodigoPedido(): string {
  const num = String(Math.floor(Math.random() * 900) + 100)
  return `SRU${num}`
}
```

Em produção, substituir por um contador sequencial no banco para evitar colisões.

---

## Mensagem gerada pro WhatsApp

```
🍣 *SURAMU SUSHI — Novo Pedido*
📋 Pedido *#SRU047*

*ITENS:*
• 2x ROBALO (Niguiri · 4 un) — R$ 64
• 1x CAVALA (Sashimi · 8 fat) — R$ 44

💰 *Total: R$ 108*

📦 *Tipo:* Delivery
👤 *Nome:* João Silva
📍 *Endereço:* Rua X, 123, Bairro Y

_Aguardando confirmação do restaurante_ 🤙
```

---

## Evolution API — configuração

- Repositório: https://github.com/EvolutionAPI/evolution-api
- Deploy recomendado: Railway (free tier suficiente pra testar)
- Conectar o número do WhatsApp via QR Code no painel da Evolution API
- Configurar o webhook apontando para `https://seusite.vercel.app/api/webhook/whatsapp`
- Variáveis de ambiente necessárias:

```env
EVOLUTION_API_URL=https://sua-evolution-api.railway.app
EVOLUTION_API_KEY=sua_chave_aqui
EVOLUTION_INSTANCE=suramu
WPP_NUMBER=5511999999999
```

---

## Variáveis de ambiente (.env)

```env
DATABASE_URL="file:./dev.db"
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=suramu
WPP_NUMBER=5511999999999
NEXT_PUBLIC_WPP_NUMBER=5511999999999
```

---

## Ordem de implementação sugerida

1. Criar o modelo `Pedido` e `ItemPedido` no Prisma e rodar a migration
2. Implementar `POST /api/pedidos` — salvar pedido e retornar o código
3. Atualizar o frontend do carrinho para chamar a API antes de abrir o `wa.me/`
4. Subir a Evolution API no Railway e conectar o número
5. Implementar `POST /api/webhook/whatsapp` com os comandos de status
6. Integrar o envio de mensagem automática pro cliente via Evolution API
7. Atualizar o painel admin para listar e filtrar pedidos por status

---

## Observações importantes

- O número do WhatsApp do restaurante deve ser um número dedicado, não o pessoal do chef
- A Evolution API usa WhatsApp Web por baixo — o celular precisa ficar conectado
- Para produção, avaliar Z-API (paga, mais estável) ou Meta Cloud API (oficial, mais burocrática)
- O painel admin já existe no projeto base (`Sistema_Restaurante_DB2`) — reaproveitar a estrutura de autenticação e layout