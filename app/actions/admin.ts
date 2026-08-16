"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/dal";
import type { Modalidade, StatusMensalidade } from "@/lib/types/database";

export type EstadoAdmin = { erro?: string; sucesso?: boolean } | undefined;

function parseDiaVencimento(formData: FormData): { valor?: number | null; erro?: string } {
  const bruto = String(formData.get("dia_vencimento") ?? "").trim();
  if (!bruto) return { valor: null };

  const numero = Number(bruto);
  if (!Number.isInteger(numero) || numero < 1 || numero > 28) {
    return { erro: "Dia de vencimento deve ser um número entre 1 e 28." };
  }
  return { valor: numero };
}

// Sincroniza aluna_planos com os plano_id marcados no form (chips), fazendo
// diff contra o que já existe: insere os novos, remove os desmarcados.
async function sincronizarPlanosDaAluna(
  supabase: SupabaseClient,
  alunaId: string,
  formData: FormData
): Promise<{ erro?: string }> {
  const planosMarcados = formData.getAll("planos").map(String);

  const { data: vinculosAtuais, error: erroBusca } = await supabase
    .from("aluna_planos")
    .select("plano_id")
    .eq("aluna_id", alunaId);

  if (erroBusca) return { erro: "Não foi possível ler os planos vinculados." };

  const idsAtuais = new Set((vinculosAtuais ?? []).map((v) => v.plano_id as string));
  const idsMarcados = new Set(planosMarcados);

  const paraInserir = planosMarcados.filter((id) => !idsAtuais.has(id));
  const paraRemover = [...idsAtuais].filter((id) => !idsMarcados.has(id));

  if (paraInserir.length > 0) {
    const { error } = await supabase
      .from("aluna_planos")
      .insert(paraInserir.map((planoId) => ({ aluna_id: alunaId, plano_id: planoId })));
    if (error) return { erro: "Não foi possível vincular os planos selecionados." };
  }

  if (paraRemover.length > 0) {
    const { error } = await supabase
      .from("aluna_planos")
      .delete()
      .eq("aluna_id", alunaId)
      .in("plano_id", paraRemover);
    if (error) return { erro: "Não foi possível desvincular os planos removidos." };
  }

  return {};
}

export async function criarAlunaAdmin(
  _estado: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const nomeCompleto = String(formData.get("nome_completo") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "") || null;
  const dataNascimento = String(formData.get("data_nascimento") ?? "") || null;
  const modalidade =
    (String(formData.get("modalidade") ?? "") || null) as Modalidade | null;

  if (!email || !senha || !nomeCompleto) {
    return { erro: "Preencha e-mail, senha e nome completo." };
  }
  if (senha.length < 6) {
    return { erro: "A senha deve ter pelo menos 6 caracteres." };
  }

  const { valor: diaVencimento, erro: erroDiaVencimento } = parseDiaVencimento(formData);
  if (erroDiaVencimento) return { erro: erroDiaVencimento };

  const admin = createAdminClient();

  const { data: usuarioCriado, error: erroCriacao } =
    await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome_completo: nomeCompleto },
    });

  if (erroCriacao || !usuarioCriado.user) {
    const jaExiste = erroCriacao?.code === "email_exists";
    return {
      erro: jaExiste
        ? "Já existe uma conta com esse e-mail."
        : "Não foi possível criar a conta.",
    };
  }

  // O trigger handle_new_user já criou a linha em profiles com o nome;
  // aqui completamos os demais dados que vieram do formulário.
  const { error: erroPerfil } = await admin
    .from("profiles")
    .update({
      telefone,
      data_nascimento: dataNascimento,
      modalidade,
      dia_vencimento: diaVencimento,
    })
    .eq("id", usuarioCriado.user.id);

  if (erroPerfil) {
    return { erro: "Conta criada, mas houve erro ao salvar os dados extras." };
  }

  const { erro: erroPlanos } = await sincronizarPlanosDaAluna(
    admin,
    usuarioCriado.user.id,
    formData
  );
  if (erroPlanos) return { erro: erroPlanos };

  revalidatePath("/admin/alunas");
  return { sucesso: true };
}

export async function atualizarAlunaAdmin(
  alunaId: string,
  _estado: EstadoAdmin,
  formData: FormData
): Promise<EstadoAdmin> {
  await requireAdmin();

  const { valor: diaVencimento, erro: erroDiaVencimento } = parseDiaVencimento(formData);
  if (erroDiaVencimento) return { erro: erroDiaVencimento };

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      nome_completo: String(formData.get("nome_completo") ?? ""),
      telefone: String(formData.get("telefone") ?? "") || null,
      data_nascimento: String(formData.get("data_nascimento") ?? "") || null,
      modalidade: (String(formData.get("modalidade") ?? "") ||
        null) as Modalidade | null,
      dia_vencimento: diaVencimento,
    })
    .eq("id", alunaId);

  if (error) return { erro: "Não foi possível salvar." };

  const { erro: erroPlanos } = await sincronizarPlanosDaAluna(
    supabase,
    alunaId,
    formData
  );
  if (erroPlanos) return { erro: erroPlanos };

  revalidatePath(`/admin/alunas/${alunaId}`);
  revalidatePath("/admin/alunas");
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
  revalidatePath("/admin/alunas");
  revalidatePath("/admin/dashboard");
  return { sucesso: true };
}
