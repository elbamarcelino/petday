import { createClient } from "@/lib/supabase/server";
import { PetsClient } from "@/components/PetsClient";
import type { Pet, Cliente } from "@/types";

export default async function PetsPage() {
  const supabase = await createClient();

  const [{ data: pets }, { data: clientes }] = await Promise.all([
    supabase
      .from("pets")
      .select("*, cliente:clientes(nome, telefone)")
      .order("nome", { ascending: true }),
    supabase
      .from("clientes")
      .select("id, nome")
      .order("nome", { ascending: true }),
  ]);

  return (
    <div className="p-8">
      <PetsClient
        pets={(pets as Pet[]) ?? []}
        clientes={(clientes as Pick<Cliente, "id" | "nome">[]) ?? []}
      />
    </div>
  );
}
