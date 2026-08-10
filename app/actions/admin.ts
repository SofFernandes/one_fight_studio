"use server";

import { revalidatePath } from "next/cache";
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
