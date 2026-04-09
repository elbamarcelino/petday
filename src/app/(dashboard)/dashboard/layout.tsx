import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/agendamentos", label: "Agendamentos", icon: "📅" },
  { href: "/dashboard/clientes", label: "Clientes", icon: "👤" },
  { href: "/dashboard/pets", label: "Pets", icon: "🐶" },
  { href: "/dashboard/servicos", label: "Serviços", icon: "✂️" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-[var(--color-background)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-card)] border-r flex flex-col shadow-sm">
        <div className="px-6 py-5 border-b">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="text-xl font-bold text-[var(--color-primary)]">PetDay</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t">
          <LogoutButton />
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
