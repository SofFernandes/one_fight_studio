"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/dal";

export type EstadoPerfil = { erro?: string; sucesso?: boolean } | undefined;

export async function atualizarDadosPessoais(
  _estado: EstadoPerfil,
  formData: FormData
): Promise<EstadoPerfil> {
  const user = await getSessionUser();
  if (!user) return { erro: "Sessão expirada." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      nome_completo: String(formData.get("nome_completo") ?? ""),
      telefone: String(formData.get("telefone") ?? "") || null,
      data_nascimento: String(formData.get("data_nascimento") ?? "") || null,
    })
    .eq("id", user.id);

  if (error) return { erro: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/perfil");
  return { sucesso: true };
}
