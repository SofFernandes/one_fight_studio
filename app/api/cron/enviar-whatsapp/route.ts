import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarTemplateWhatsapp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataBr(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

// Tenta registrar a idempotência ANTES de enviar: se já existir uma linha para
// (aluna, tipo, hoje), o insert falha por unique constraint e pulamos o envio.
async function jaEnviadoHoje(
  admin: ReturnType<typeof createAdminClient>,
  alunaId: string,
  tipo: "vencimento" | "aniversario",
  referencia: string
): Promise<boolean> {
  const { error } = await admin
    .from("mensagens_enviadas")
    .insert({ aluna_id: alunaId, tipo, referencia });

  // Erro de violação de unique constraint (23505) = já foi registrado hoje.
  if (error?.code === "23505") return true;
  if (error) {
    console.error("[cron enviar-whatsapp] erro ao registrar idempotência:", error);
    return true; // por segurança, não envia se não conseguimos garantir idempotência
  }
  return false;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const templateVencimento = process.env.WHATSAPP_TEMPLATE_VENCIMENTO;
  const templateAniversario = process.env.WHATSAPP_TEMPLATE_ANIVERSARIO;

  if (
    !process.env.WHATSAPP_PHONE_NUMBER_ID ||
    !process.env.WHATSAPP_ACCESS_TOKEN ||
    !templateVencimento ||
    !templateAniversario
  ) {
    return NextResponse.json({ erro: "WhatsApp não configurado." });
  }

  const admin = createAdminClient();
  const referencia = hojeISO();

  let vencimentoEnviados = 0;
  let aniversarioEnviados = 0;

  // ---- Bloco vencimento: mensalidades pendentes com vencimento no passado ----
  const { data: mensalidadesAtrasadas, error: erroMensalidades } = await admin
    .from("mensalidades")
    .select("aluna_id, valor_centavos, vencimento, profiles(nome_completo, telefone)")
    .eq("status", "pendente")
    .lt("vencimento", referencia);

  if (erroMensalidades) {
    console.error("[cron enviar-whatsapp] erro ao buscar mensalidades atrasadas:", erroMensalidades);
  }

  for (const mensalidade of mensalidadesAtrasadas ?? []) {
    const perfil = mensalidade.profiles as unknown as {
      nome_completo: string;
      telefone: string | null;
    } | null;

    if (!perfil?.telefone) {
      console.warn(`[cron enviar-whatsapp] aluna ${mensalidade.aluna_id} sem telefone, pulando aviso de vencimento.`);
      continue;
    }

    const jaEnviado = await jaEnviadoHoje(admin, mensalidade.aluna_id, "vencimento", referencia);
    if (jaEnviado) continue;

    const resultado = await enviarTemplateWhatsapp(perfil.telefone, templateVencimento, [
      perfil.nome_completo,
      formatarReais(mensalidade.valor_centavos),
      formatarDataBr(mensalidade.vencimento),
    ]);

    if (resultado.sucesso) {
      vencimentoEnviados++;
    } else {
      console.error(`[cron enviar-whatsapp] falha ao enviar vencimento para ${mensalidade.aluna_id}:`, resultado.erro);
    }
  }

  // ---- Bloco aniversário: alunas cujo mês/dia de nascimento é hoje ----
  const hoje = new Date();
  const mesHoje = hoje.getUTCMonth() + 1;
  const diaHoje = hoje.getUTCDate();

  const { data: aniversariantes, error: erroAniversariantes } = await admin
    .from("profiles")
    .select("id, nome_completo, telefone, data_nascimento")
    .eq("papel", "aluna")
    .not("data_nascimento", "is", null);

  if (erroAniversariantes) {
    console.error("[cron enviar-whatsapp] erro ao buscar aniversariantes:", erroAniversariantes);
  }

  for (const aluna of aniversariantes ?? []) {
    if (!aluna.data_nascimento) continue;
    const nascimento = new Date(`${aluna.data_nascimento}T00:00:00`);
    const ehAniversario =
      nascimento.getUTCMonth() + 1 === mesHoje && nascimento.getUTCDate() === diaHoje;
    if (!ehAniversario) continue;

    if (!aluna.telefone) {
      console.warn(`[cron enviar-whatsapp] aluna ${aluna.id} sem telefone, pulando parabéns.`);
      continue;
    }

    const jaEnviado = await jaEnviadoHoje(admin, aluna.id, "aniversario", referencia);
    if (jaEnviado) continue;

    const resultado = await enviarTemplateWhatsapp(aluna.telefone, templateAniversario, [
      aluna.nome_completo,
    ]);

    if (resultado.sucesso) {
      aniversarioEnviados++;
    } else {
      console.error(`[cron enviar-whatsapp] falha ao enviar aniversário para ${aluna.id}:`, resultado.erro);
    }
  }

  return NextResponse.json({ vencimentoEnviados, aniversarioEnviados });
}
