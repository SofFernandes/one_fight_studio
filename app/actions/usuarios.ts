"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/dal";
import type { Papel } from "@/lib/types/database";

export type EstadoUsuario = { erro?: string; sucesso?: boolean } | undefined;

export async function criarAdminAdmin(
  _estado: EstadoUsuario,
  formData: FormData
): Promise<EstadoUsuario> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const nomeCompleto = String(formData.get("nome_completo") ?? "").trim();

  if (!email || !senha || !nomeCompleto) {
    return { erro: "Preencha e-mail, senha e nome completo." };
  }
  if (senha.length < 6) {
    return { erro: "A senha deve ter pelo menos 6 caracteres." };
  }

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

  // O trigger handle_new_user já criou a linha em profiles com papel 'aluna'
  // por padrão; aqui promovemos para admin.
  const { error: erroPerfil } = await admin
    .from("profiles")
    .update({ papel: "admin" })
    .eq("id", usuarioCriado.user.id);

  if (erroPerfil) {
    return { erro: "Conta criada, mas houve erro ao definir o papel de admin." };
  }

  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function alterarSenhaUsuarioAdmin(
  userId: string,
  _estado: EstadoUsuario,
  formData: FormData
): Promise<EstadoUsuario> {
  await requireAdmin();

  const senha = String(formData.get("senha") ?? "");
  if (senha.length < 6) {
    return { erro: "A senha deve ter pelo menos 6 caracteres." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: senha,
  });

  if (error) return { erro: "Não foi possível alterar a senha." };

  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}

export async function alterarPapelUsuarioAdmin(
  userId: string,
  novoPapel: Papel
): Promise<EstadoUsuario> {
  const adminAtual = await requireAdmin();

  if (userId === adminAtual.id && novoPapel !== "admin") {
    return { erro: "Você não pode remover seu próprio acesso de admin." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ papel: novoPapel })
    .eq("id", userId);

  if (error) return { erro: "Não foi possível alterar o papel." };

  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}
