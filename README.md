# RestaurantOS

Sistema de gestão para restaurantes desenvolvido com Next.js, Prisma e SQLite. Permite o gerenciamento completo do fluxo operacional — do cardápio à entrega dos pedidos — com painel administrativo protegido por autenticação.

## Funcionalidades

- **Cardápio digital** — exibição de pratos com disponibilidade em tempo real
- **Criação de pedidos** — seleção de itens, mesa e canal de atendimento (presencial, takeaway, online)
- **Display de cozinha** — visualização e atualização de pedidos por status
- **Gestão de mesas** — controle de ocupação e liberação
- **Painel administrativo** — CRUD de pratos, tabelas e pedidos com controle de estoque

## Tecnologias

- [Next.js 16](https://nextjs.org/) — App Router, Server Components, API Routes
- [Prisma 7](https://www.prisma.io/) — ORM com adapter para SQLite via libsql
- [SQLite](https://www.sqlite.org/) — banco de dados local (`dev.db`)
- [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS v4](https://tailwindcss.com/) — interface
- TypeScript

## Pré-requisitos

- Node.js 18+
- npm, yarn ou pnpm

## Instalação e execução

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/restaurant.git
cd restaurant

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
# Crie um arquivo .env na raiz com o conteúdo abaixo:
# DATABASE_URL="file:./dev.db"
# ADMIN_PASSWORD="admin123"

# 4. Gerar o cliente Prisma
npx prisma generate

# 5. Criar o banco de dados e aplicar o schema
npx prisma migrate dev --name init

# 6. Popular o banco com dados de exemplo (opcional)
npm run seed

# 7. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Variáveis de ambiente

| Variável         | Descrição                                      | Exemplo           |
|-----------------|------------------------------------------------|-------------------|
| `DATABASE_URL`  | Caminho para o arquivo SQLite                  | `file:./dev.db`   |
| `ADMIN_PASSWORD`| Senha de acesso ao painel administrativo       | `admin123`        |

## Scripts disponíveis

| Comando          | Descrição                                    |
|-----------------|----------------------------------------------|
| `npm run dev`   | Inicia o servidor de desenvolvimento         |
| `npm run build` | Gera a build de produção                     |
| `npm run start` | Inicia o servidor em modo produção           |
| `npm run seed`  | Popula o banco com dados de exemplo          |

## Rotas da aplicação

### Público

| Rota                    | Descrição                          |
|------------------------|------------------------------------|
| `/`                    | Página inicial                     |
| `/menu`                | Cardápio digital                   |
| `/pedido`              | Criar novo pedido                  |
| `/pedido/confirmacao`  | Confirmação de pedido realizado    |
| `/kitchen`             | Display de cozinha                 |
| `/tables`              | Painel de mesas                    |

### Administrativo (requer autenticação)

| Rota                       | Descrição                        |
|---------------------------|----------------------------------|
| `/admin/login`            | Login administrativo             |
| `/admin`                  | Visão geral (dashboard)          |
| `/admin/dishes`           | Gerenciar pratos                 |
| `/admin/dishes/new`       | Cadastrar novo prato             |
| `/admin/dishes/[id]/edit` | Editar prato                     |
| `/admin/tables`           | Gerenciar mesas                  |
| `/admin/orders`           | Gerenciar pedidos                |

## Acesso administrativo

Acesse `/admin/login` e informe a senha configurada em `ADMIN_PASSWORD` (padrão: `admin123`).

A sessão é mantida por cookie seguro com duração de 24 horas.

## Estrutura do projeto

```
.
├── app/
│   ├── (pages)/            # Rotas da aplicação
│   ├── api/                # API Routes (dishes, orders, tables, auth)
│   └── generated/prisma/   # Cliente Prisma gerado
├── components/             # Componentes compartilhados (navbar, ui)
├── lib/                    # Utilitários (prisma, auth, constants)
├── prisma/
│   ├── schema.prisma       # Schema do banco de dados
│   └── seed.ts             # Script de seed
├── services/               # Camada de serviços (dishService, orderService)
└── proxy.ts                # Middleware de autenticação (Next.js 16)
```

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
