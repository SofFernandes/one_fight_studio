"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import type { Modalidade } from "@/lib/types/database";

export type EstadoPlano = { erro?: string; sucesso?: boolean } | undefined;

// Preserva histórico de preço: encerra a vigência do plano atual e cria um
// novo registro, em vez de sobrescrever o valor (ver comentário no schema).
export async function ajustarValorPlano(
  modalidade: Modalidade,
  nome: string,
  _estado: EstadoPlano,
  formData: FormData
): Promise<EstadoPlano> {
  await requireAdmin();
  const supabase = await createClient();

  const valorReais = Number(String(formData.get("valor") ?? "0").replace(",", "."));
  const valorCentavos = Math.round(valorReais * 100);
  const hoje = new Date().toISOString().slice(0, 10);

  const { error: encerraError } = await supabase
    .from("planos")
    .update({ vigencia_fim: hoje })
    .eq("modalidade", modalidade)
    .is("vigencia_fim", null);

  if (encerraError) return { erro: "Não foi possível encerrar o plano atual." };

  const { error: criaError } = await supabase.from("planos").insert({
    modalidade,
    nome,
    valor_centavos: valorCentavos,
    vigencia_inicio: hoje,
  });

  if (criaError) return { erro: "Não foi possível criar o novo plano." };

  revalidatePath("/admin/planos");
  return { sucesso: true };
}
