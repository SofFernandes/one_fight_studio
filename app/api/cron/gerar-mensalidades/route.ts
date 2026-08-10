import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanoVigente } from "@/lib/planos";
import type { Modalidade } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function competenciaEVencimentoDeHoje() {
  const hoje = new Date();
  const ano = hoje.getUTCFullYear();
  const mes = hoje.getUTCMonth() + 1;
  const diaDoMes = hoje.getUTCDate();
  const mesFormatado = String(mes).padStart(2, "0");
  const diaFormatado = String(diaDoMes).padStart(2, "0");

  return {
    diaDoMes,
    competencia: `${ano}-${mesFormatado}-01`,
    vencimento: `${ano}-${mesFormatado}-${diaFormatado}`,
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { diaDoMes, competencia, vencimento } = competenciaEVencimentoDeHoje();

  const { data: candidatas, error: erroCandidatas } = await admin
    .from("profiles")
    .select("id, modalidade")
    .eq("papel", "aluna")
    .eq("dia_vencimento", diaDoMes)
    .not("modalidade", "is", null);

  if (erroCandidatas) {
    console.error("[cron gerar-mensalidades] erro ao buscar candidatas:", erroCandidatas);
    return NextResponse.json({ erro: "Falha ao buscar alunas." }, { status: 500 });
  }

  if (!candidatas || candidatas.length === 0) {
    return NextResponse.json({ processadas: 0, competencia, dia: diaDoMes });
  }

  const modalidadesUnicas = Array.from(
    new Set(candidatas.map((c) => c.modalidade as Modalidade))
  );

  const planoPorModalidade = new Map<Modalidade, { id: string; valor_centavos: number }>();
  for (const modalidade of modalidadesUnicas) {
    const plano = await getPlanoVigente(admin, modalidade);
    if (plano) {
      planoPorModalidade.set(modalidade, plano);
    } else {
      console.warn(`[cron gerar-mensalidades] sem plano vigente para modalidade "${modalidade}", pulando.`);
    }
  }

  const linhas = candidatas
    .map((aluna) => {
      const plano = planoPorModalidade.get(aluna.modalidade as Modalidade);
      if (!plano) return null;
      return {
        aluna_id: aluna.id,
        plano_id: plano.id,
        competencia,
        valor_centavos: plano.valor_centavos,
        vencimento,
        status: "pendente" as const,
      };
    })
    .filter((linha): linha is NonNullable<typeof linha> => linha !== null);

  if (linhas.length === 0) {
    return NextResponse.json({ processadas: 0, competencia, dia: diaDoMes });
  }

  const { error: erroUpsert } = await admin
    .from("mensalidades")
    .upsert(linhas, { onConflict: "aluna_id,competencia", ignoreDuplicates: true });

  if (erroUpsert) {
    console.error("[cron gerar-mensalidades] erro ao inserir mensalidades:", erroUpsert);
    return NextResponse.json({ erro: "Falha ao gerar mensalidades." }, { status: 500 });
  }

  return NextResponse.json({ processadas: linhas.length, competencia, dia: diaDoMes });
}
