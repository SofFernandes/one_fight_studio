"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import type { Modalidade } from "@/lib/types/database";

export type EstadoPlano = { erro?: string; sucesso?: boolean } | undefined;

function parseValorCentavos(formData: FormData): number {
  const valorReais = Number(String(formData.get("valor") ?? "0").replace(",", "."));
  return Math.round(valorReais * 100);
}

export async function criarPlanoAdmin(
  _estado: EstadoPlano,
  formData: FormData
): Promise<EstadoPlano> {
  await requireAdmin();
  const supabase = await createClient();

  const nome = String(formData.get("nome") ?? "").trim();
  const modalidade = String(formData.get("modalidade") ?? "") as Modalidade;
  const valorCentavos = parseValorCentavos(formData);

  if (!nome || !modalidade) {
    return { erro: "Preencha nome e modalidade." };
  }

  const { error } = await supabase.from("planos").insert({
    modalidade,
    nome,
    valor_centavos: valorCentavos,
  });

  if (error) return { erro: "Não foi possível criar o plano." };

  revalidatePath("/admin/planos");
  return { sucesso: true };
}

// Preserva histórico de preço: encerra a vigência do plano atual e cria um
// novo registro, em vez de sobrescrever o valor (ver comentário no schema).
// Opera por plano.id específico — nunca encerra outros planos da mesma modalidade.
export async function ajustarValorPlano(
  planoId: string,
  _estado: EstadoPlano,
  formData: FormData
): Promise<EstadoPlano> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: planoAtual, error: erroBusca } = await supabase
    .from("planos")
    .select("modalidade, nome")
    .eq("id", planoId)
    .single();

  if (erroBusca || !planoAtual) return { erro: "Plano não encontrado." };

  const valorCentavos = parseValorCentavos(formData);
  const hoje = new Date().toISOString().slice(0, 10);

  const { error: encerraError } = await supabase
    .from("planos")
    .update({ vigencia_fim: hoje })
    .eq("id", planoId);

  if (encerraError) return { erro: "Não foi possível encerrar o plano atual." };

  const { error: criaError } = await supabase.from("planos").insert({
    modalidade: planoAtual.modalidade,
    nome: planoAtual.nome,
    valor_centavos: valorCentavos,
    vigencia_inicio: hoje,
  });

  if (criaError) return { erro: "Não foi possível criar o novo plano." };

  revalidatePath("/admin/planos");
  return { sucesso: true };
}
