# RestaurantOS

Sistema completo de gerenciamento de restaurante com controle de pedidos, mesas, cozinha, delivery e administração financeira. Possui controle de acesso por cargo (Admin, Garçom, Cozinheiro) e fluxo público para clientes via QR code ou link de delivery.

---

## Tecnologias

- **Next.js 16** (App Router, webpack)
- **Prisma 7** + **SQLite** (via libsql)
- **Tailwind CSS 4** + **shadcn/ui**
- **TypeScript**

---

## Instalação

```bash
npm install
```

### Variáveis de ambiente

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="file:./dev.db"

# Senha usada pelo seed para criar o usuário admin inicial
ADMIN_PASSWORD="admin123"

# Segredo para assinar tokens de sessão e fazer hash de senhas
# Troque para um valor aleatório longo antes de ir para produção
AUTH_SECRET="rest_secret_2024"

NODE_ENV="development"
```

> **Importante:** Se alterar `AUTH_SECRET` após o seed, os hashes de senha no banco ficam inválidos — rode o seed novamente.

### Banco de dados

```bash
# Aplicar migrations (cria o banco se não existir)
npx prisma migrate deploy

# Gerar o cliente Prisma
npx prisma generate

# Popular com dados iniciais — RODAR COM O SERVIDOR PARADO
npm run db:seed
```

> O SQLite não suporta dois processos escrevendo ao mesmo tempo. O seed falhará se o servidor estiver rodando.

### Iniciar

```bash
npm run dev
```

Acesse em `http://localhost:3000`.

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run db:migrate` | Criar/atualizar tabelas |
| `npm run db:seed` | Popular banco com dados iniciais |
| `npm run db:reset` | Resetar banco e rodar seed novamente |

---

## Primeiro acesso

Após rodar o seed, os seguintes usuários são criados automaticamente:

| Usuário | Senha | Cargo |
|---------|-------|-------|
| `admin` | `admin123` | Administrador |
| `ana.garcom` | `garcom123` | Garçom |
| `carlos.garcom` | `garcom123` | Garçom |
| `fernanda.cozinha` | `cozinha123` | Cozinheiro |

Login em: `http://localhost:3000/admin/login`

Para alterar senhas: **Admin → Funcionários → Editar → campo Senha**.  
Para criar novos funcionários com acesso: **Admin → Funcionários → Adicionar Funcionário** (preencher Usuário e Senha).

---

## Controle de acesso por cargo

| Recurso | Admin | Garçom | Cozinheiro | Cliente (sem login) |
|---------|-------|--------|------------|---------------------|
| Dashboard `/` | ✓ | ✓ | ✓ | — |
| Cardápio `/menu` | ✓ | ✓ | ✓ | ✓ |
| Pedido salão `/pedido?mesa=X` | ✓ | ✓ | — | ✓ |
| Confirmação `/pedido/confirmacao` | ✓ | ✓ | — | ✓ |
| Retirada `/retirada` | ✓ | ✓ | — | ✓ |
| Confirmação retirada `/retirada/confirmacao` | ✓ | ✓ | — | ✓ |
| Delivery `/delivery` | ✓ | ✓ | — | ✓ |
| Confirmação delivery `/delivery/confirmacao` | ✓ | ✓ | — | ✓ |
| Cozinha `/kitchen` | ✓ | ✓ | ✓ | — |
| Mesas `/tables` | ✓ | ✓ | — | — |
| Admin hub `/admin` | ✓ | — | — | — |
| Pedidos `/admin/orders` | ✓ | — | — | — |
| Pratos `/admin/dishes` | ✓ | — | — | — |
| Mesas `/admin/tables` | ✓ | — | — | — |
| Funcionários `/admin/employees` | ✓ | — | — | — |
| Clientes `/admin/customers` | ✓ | — | — | — |
| Faturamento `/admin/billing` | ✓ | — | — | — |
| Folha de pagamento `/admin/payroll` | ✓ | — | — | — |
| Relatório financeiro `/admin/report` | ✓ | — | — | — |

> Cozinheiro é redirecionado automaticamente para `/kitchen` ao tentar qualquer outra rota protegida.  
> Garçom é redirecionado para `/` ao tentar acessar qualquer rota `/admin/*`.

---

## Rotas do sistema

### Públicas (clientes — sem login)

Existem três fluxos de pedido separados, cada um com canal fixo — o cliente não escolhe o canal:

| Rota | Canal | Descrição |
|------|-------|-----------|
| `/menu` | — | Cardápio completo (só visualização) |
| `/pedido?mesa=X` | DINE_IN | Pedido no salão com mesa pré-selecionada via QR code |
| `/pedido` | DINE_IN | Pedido no salão com seleção manual de mesa |
| `/pedido/confirmacao?id=X` | — | Confirmação do pedido de salão |
| `/retirada` | TAKEAWAY | Pedido para retirada no balcão (link do caixa) |
| `/retirada/confirmacao?id=X` | — | Confirmação do pedido de retirada |
| `/delivery` | ONLINE | Pedido com entrega em domicílio |
| `/delivery/confirmacao?id=X` | — | Confirmação do pedido de entrega |

### QR codes das mesas (salão)

Cada mesa recebe um QR code fixo. Gere um QR code apontando para:

```
http://SEU_IP:3000/pedido?mesa=ID_DA_MESA
```

Mesas padrão do seed:

| Mesa | Link |
|------|------|
| Mesa 01 | `/pedido?mesa=1` |
| Mesa 02 | `/pedido?mesa=2` |
| Mesa 03 | `/pedido?mesa=3` |
| Mesa 04 | `/pedido?mesa=4` |
| Mesa 05 | `/pedido?mesa=5` |
| Mesa 06 | `/pedido?mesa=6` |

> O ID da mesa pode ser consultado em **Admin → Mesas**.

### QR code do balcão (retirada)

Um único QR code fixo para o caixa/balcão, apontando para:

```
http://SEU_IP:3000/retirada
```

O cliente informa telefone, nome e observações opcionais (ex: sem cebola, embrulhar para presente).

### Funcionários (requer login)

| Rota | Cargo mínimo | Descrição |
|------|-------------|-----------|
| `/` | Garçom | Dashboard com pedidos ativos e mesas ocupadas |
| `/kitchen` | Cozinheiro | Painel da cozinha — avança status dos pedidos |
| `/tables` | Garçom | Visualiza e alterna status das mesas |
| `/admin/login` | — | Tela de login |
| `/admin` | Admin | Hub com acesso a todas as áreas |
| `/admin/orders` | Admin | Histórico completo de pedidos com cancelamento |
| `/admin/dishes` | Admin | CRUD de pratos, estoque e disponibilidade |
| `/admin/tables` | Admin | Cadastro e remoção de mesas |
| `/admin/employees` | Admin | Cadastro de funcionários e credenciais de acesso |
| `/admin/customers` | Admin | Histórico e exportação de clientes |
| `/admin/billing` | Admin | Receitas, despesas por categoria |
| `/admin/payroll` | Admin | Folha de pagamento com gratificação (exclui cancelados) |
| `/admin/report` | Admin | Resultado financeiro líquido do período |

---

## Fluxo de pedido — Salão

1. Cliente escaneia QR code da mesa → abre `/pedido?mesa=X` com mesa pré-selecionada
2. Informa telefone (cliente existente é identificado automaticamente) e nome
3. Seleciona os pratos e confirma
4. Pedido aparece na cozinha com canal **Salão** e status **Recebido**
5. Cozinha avança: **Recebido → Em Preparo → Pronto → Entregue**
6. Ao marcar como Entregue, a mesa é liberada automaticamente

## Fluxo de pedido — Retirada

1. Cliente escaneia QR code do balcão → abre `/retirada`
2. Informa telefone, nome e observações opcionais
3. Seleciona os pratos e confirma
4. Pedido aparece na cozinha com canal **Para Viagem**
5. Cozinha prepara e avança o status normalmente
6. Cliente retira no balcão quando status chegar em **Pronto**

## Fluxo de pedido — Delivery

1. Cliente acessa `/delivery`
2. Informa telefone, nome e endereço (Rua, Número, Complemento opcional, Bairro)
3. Seleciona os pratos e confirma
4. Pedido aparece na cozinha com canal **Online** e endereço de entrega visível
5. Cozinha avança o status normalmente

---

## Estrutura do projeto

```
app/
├── admin/           # Páginas administrativas (requer login ADMIN)
│   ├── billing/
│   ├── customers/
│   ├── dishes/
│   ├── employees/
│   ├── login/
│   ├── orders/
│   ├── payroll/
│   ├── report/
│   └── tables/
├── api/             # Endpoints REST
│   ├── auth/        # login, logout, me
│   ├── billing/
│   ├── customers/
│   ├── dishes/
│   ├── employees/
│   ├── expenses/
│   ├── orders/
│   ├── payroll/
│   ├── report/
│   └── tables/
├── delivery/        # Pedido delivery público (ONLINE)
├── kitchen/         # Painel da cozinha
├── menu/            # Cardápio público
├── pedido/          # Pedido no salão público (DINE_IN)
├── retirada/        # Pedido para retirada público (TAKEAWAY)
└── tables/          # Status das mesas

components/          # Navbar, componentes UI
lib/                 # auth.ts, prisma.ts, constants.ts
prisma/              # schema.prisma, migrations/, seed.ts
services/            # orderService.ts, customerService.ts
proxy.ts             # Controle de acesso por cargo (Next.js 16)
```

---

## Observações para produção

- Trocar `AUTH_SECRET` por uma string aleatória longa (mínimo 32 caracteres)
- Trocar `ADMIN_PASSWORD` pela senha real antes de rodar o seed
- Definir `NODE_ENV="production"` para ativar cookies com flag `Secure` (exige HTTPS)
- O SQLite é adequado para uso local/pequeno porte — para escala considerar PostgreSQL
- As sessões são stateless (token assinado com HMAC) — não requerem Redis
