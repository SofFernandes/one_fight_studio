"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import type { Modalidade, StatusMensalidade } from "@/lib/types/database";

export type EstadoAdmin = { erro?: string; sucesso?: boolean } | undefined;

export async function atualizarAlunaAdmin(
  alunaId: string,
  _estado: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      nome_completo: String(formData.get("nome_completo") ?? ""),
      telefone: String(formData.get("telefone") ?? "") || null,
      data_nascimento: String(formData.get("data_nascimento") ?? "") || null,
      modalidade: (String(formData.get("modalidade") ?? "") ||
        null) as Modalidade | null,
    })
    .eq("id", alunaId);

  if (error) return { erro: "Não foi possível salvar." };

  revalidatePath(`/admin/alunas/${alunaId}`);
  revalidatePath("/admin");
  return { sucesso: true };
}

export async function atualizarMensalidadeAdmin(
  mensalidadeId: string,
  alunaId: string,
  _estado: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("mensalidades")
    .update({
      vencimento: String(formData.get("vencimento") ?? ""),
      valor_centavos: Math.round(
        Number(String(formData.get("valor") ?? "0").replace(",", ".")) * 100
      ),
      status: String(formData.get("status") ?? "pendente") as StatusMensalidade,
      pago_em:
        String(formData.get("status")) === "pago"
          ? new Date().toISOString()
          : null,
    })
    .eq("id", mensalidadeId);

  if (error) return { erro: "Não foi possível salvar a mensalidade." };

  revalidatePath(`/admin/alunas/${alunaId}`);
  revalidatePath("/admin");
  return { sucesso: true };
}
