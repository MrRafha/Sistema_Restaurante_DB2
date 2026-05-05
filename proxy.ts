import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, getSession } from "@/lib/auth";

// Rotas públicas — acessíveis sem sessão (clientes via QR code/mesa/delivery)
const PUBLIC_PATHS = [
  "/menu",
  "/pedido",
  "/delivery",
  "/retirada",
  "/admin/login",
  "/api/auth/login",
  "/api/auth/me",
  "/api/dishes",
  "/api/customers/lookup",
];

// Rotas exclusivas de ADMIN
const ADMIN_ONLY_PATHS = [
  "/admin/employees",
  "/admin/billing",
  "/admin/payroll",
  "/admin/report",
  "/admin/customers",
  "/admin/dishes",
  "/admin/tables",
  "/api/employees",
  "/api/billing",
  "/api/payroll",
  "/api/report",
  "/api/expenses",
  "/api/customers",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Sempre permitir logout
  if (pathname === "/api/auth/logout") return NextResponse.next();

  // GET /api/tables — público para cliente selecionar mesa
  if (pathname === "/api/tables" && method === "GET") return NextResponse.next();

  // POST /api/orders — público (cliente faz pedido sem login)
  if (pathname === "/api/orders" && method === "POST") return NextResponse.next();

  // GET /api/orders/[id] — público (tela de confirmação do cliente)
  if (/^\/api\/orders\/\d+$/.test(pathname) && method === "GET") return NextResponse.next();

  // Verificar se é rota pública
  if (pathname === "/") return NextResponse.next();
  const isPublic = PUBLIC_PATHS.some((p) => p !== "/" && pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // A partir daqui, sessão é obrigatória
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? getSession(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rotas exclusivas de ADMIN
  const isAdminOnly = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminOnly && session.role !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Cozinheiro só acessa /kitchen e /api/orders
  if (
    session.role === "COZINHEIRO" &&
    !pathname.startsWith("/kitchen") &&
    !pathname.startsWith("/api/orders")
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/kitchen", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$|.*\\.ico$|.*\\.glb$|.*\\.gltf$|.*\\.avif$).*)"],
};
