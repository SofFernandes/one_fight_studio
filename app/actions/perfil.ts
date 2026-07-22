"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/dal";
import type { Modalidade } from "@/lib/types/database";

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
      modalidade: (String(formData.get("modalidade") ?? "") ||
        null) as Modalidade | null,
    })
    .eq("id", user.id);

  if (error) return { erro: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/perfil");
  return { sucesso: true };
}

export async function enviarFoto(
  tipo: "antes" | "atual",
  formData: FormData
): Promise<EstadoPerfil> {
  const user = await getSessionUser();
  if (!user) return { erro: "Sessão expirada." };

  const arquivo = formData.get("foto") as File | null;
  if (!arquivo || arquivo.size === 0) return { erro: "Selecione uma foto." };

  const supabase = await createClient();
  const extensao = arquivo.name.split(".").pop() ?? "jpg";
  const caminho = `${user.id}/${tipo}.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from("fotos-alunas")
    .upload(caminho, arquivo, { upsert: true });

  if (uploadError) return { erro: "Falha ao enviar a foto." };

  const coluna = tipo === "antes" ? "foto_antes_url" : "foto_atual_url";
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ [coluna]: caminho })
    .eq("id", user.id);

  if (updateError) return { erro: "Falha ao salvar a foto." };

  revalidatePath("/perfil");
  return { sucesso: true };
}
