import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plano } from "@/lib/types/database";

export async function getPlanosVigentes(
  supabase: SupabaseClient
): Promise<Plano[]> {
  const { data } = await supabase
    .from("planos")
    .select("*")
    .is("vigencia_fim", null)
    .order("modalidade")
    .order("nome")
    .returns<Plano[]>();

  return data ?? [];
}

export async function getPlanosVigentesDaAluna(
  supabase: SupabaseClient,
  alunaId: string
): Promise<Plano[]> {
  const { data } = await supabase
    .from("aluna_planos")
    .select("planos!inner(*)")
    .eq("aluna_id", alunaId)
    .is("planos.vigencia_fim", null);

  const planos = (data ?? [])
    .map((linha) => linha.planos as unknown as Plano | null)
    .filter((plano): plano is Plano => plano !== null);

  return planos;
}
