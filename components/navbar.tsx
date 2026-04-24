"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChefHat, Menu, ShoppingBag, Table2, Settings, ClipboardList, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Role = "ADMIN" | "GARCOM" | "COZINHEIRO" | null;

const ALL_NAV_ITEMS = [
  { href: "/menu",    label: "Cardápio", icon: ShoppingBag, roles: ["ADMIN", "GARCOM"] as Role[] },
  { href: "/pedido",  label: "Pedido",   icon: ClipboardList, roles: ["ADMIN", "GARCOM"] as Role[] },
  { href: "/kitchen", label: "Cozinha",  icon: ChefHat,  roles: ["ADMIN", "GARCOM", "COZINHEIRO"] as Role[] },
  { href: "/tables",  label: "Mesas",    icon: Table2,   roles: ["ADMIN", "GARCOM"] as Role[] },
  { href: "/admin",   label: "Admin",    icon: Settings, roles: ["ADMIN"] as Role[] },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setRole(data.role ?? null))
      .catch(() => setRole(null))
      .finally(() => setLoadingRole(false));
  }, [pathname]);

  // Rotas públicas do cliente — sem navbar de funcionário
  const isClientRoute =
    (pathname.startsWith("/menu") || pathname.startsWith("/pedido")) && !role;

  const navItems = role
    ? ALL_NAV_ITEMS.filter((item) => item.roles.includes(role))
    : [];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-orange-600 text-lg">
            <Menu className="h-6 w-6" />
            <span>RestaurantOS</span>
          </Link>

          <div className="flex items-center gap-1">
            {!loadingRole && navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orange-50 text-orange-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            {!loadingRole && role && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}

            {!loadingRole && !role && !isClientRoute && (
              <Link
                href="/admin/login"
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
