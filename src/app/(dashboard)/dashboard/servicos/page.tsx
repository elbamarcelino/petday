import { createClient } from "@/lib/supabase/server";
import { ServicosClient } from "@/components/ServicosClient";
import type { Servico } from "@/types";

export default async function ServicosPage() {
  const supabase = await createClient();
  const { data: servicos } = await supabase
    .from("servicos")
    .select("*")
    .order("nome", { ascending: true });

  return (
    <div className="p-8">
      <ServicosClient servicos={(servicos as Servico[]) ?? []} />
    </div>
  );
}
