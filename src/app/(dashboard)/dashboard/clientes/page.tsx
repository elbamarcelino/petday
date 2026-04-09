import { createClient } from "@/lib/supabase/server";
import { ClientesClient } from "@/components/ClientesClient";
import type { Cliente } from "@/types";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("nome", { ascending: true });

  return (
    <div className="p-8">
      <ClientesClient clientes={(clientes as Cliente[]) ?? []} />
    </div>
  );
}
