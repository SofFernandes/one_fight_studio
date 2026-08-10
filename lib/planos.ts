import type { SupabaseClient } from "@supabase/supabase-js";
import type { Modalidade, Plano } from "@/lib/types/database";

export async function getPlanoVigente(
  supabase: SupabaseClient,
  modalidade: Modalidade
): Promise<Plano | null> {
  const { data } = await supabase
    .from("planos")
    .select("*")
    .eq("modalidade", modalidade)
    .is("vigencia_fim", null)
    .order("vigencia_inicio", { ascending: false })
    .limit(1)
    .maybeSingle<Plano>();

  return data ?? null;
}
