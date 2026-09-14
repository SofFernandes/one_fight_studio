"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/dal";

export type EstadoProgresso = { erro?: string; sucesso?: boolean } | undefined;

export async function adicionarRegistroProgresso(
  _estado: EstadoProgresso,
  formData: FormData
): Promise<EstadoProgresso> {
  const user = await getSessionUser();
  if (!user) return { erro: "Sessão expirada." };

  const dataRegistro = String(formData.get("data_registro") ?? "") || null;
  const pesoBruto = String(formData.get("peso") ?? "").trim();
  const alturaBruta = String(formData.get("altura") ?? "").trim();
  const arquivo = formData.get("foto") as File | null;
  const temFoto = arquivo && arquivo.size > 0;

  const peso = pesoBruto ? Number(pesoBruto.replace(",", ".")) : null;
  const altura = alturaBruta ? Math.round(Number(alturaBruta)) : null;

  if (!temFoto && peso === null && altura === null) {
    return { erro: "Preencha ao menos foto, peso ou altura." };
  }
  if (peso !== null && (Number.isNaN(peso) || peso <= 0)) {
    return { erro: "Peso inválido." };
  }
  if (altura !== null && (Number.isNaN(altura) || altura <= 0)) {
    return { erro: "Altura inválida." };
  }

  const supabase = await createClient();
  let fotoUrl: string | null = null;

  if (temFoto && arquivo) {
    const extensao = arquivo.name.split(".").pop() ?? "jpg";
    const caminho = `${user.id}/${crypto.randomUUID()}.${extensao}`;

    const { error: uploadError } = await supabase.storage
      .from("fotos-alunas")
      .upload(caminho, arquivo);

    if (uploadError) return { erro: "Falha ao enviar a foto." };
    fotoUrl = caminho;
  }

  const { error } = await supabase.from("registros_progresso").insert({
    aluna_id: user.id,
    data_registro: dataRegistro ?? new Date().toISOString().slice(0, 10),
    foto_url: fotoUrl,
    peso_kg: peso,
    altura_cm: altura,
  });

  if (error) return { erro: "Não foi possível salvar o registro." };

  revalidatePath("/perfil");
  return { sucesso: true };
}
