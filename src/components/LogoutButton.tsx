"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-[var(--color-danger)] transition-colors"
    >
      <span>🚪</span>
      Sair
    </button>
  );
}
