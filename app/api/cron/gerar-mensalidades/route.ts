import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanosVigentesDaAluna } from "@/lib/planos";

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
    .select("id")
    .eq("papel", "aluna")
    .eq("dia_vencimento", diaDoMes);

  if (erroCandidatas) {
    console.error("[cron gerar-mensalidades] erro ao buscar candidatas:", erroCandidatas);
    return NextResponse.json({ erro: "Falha ao buscar alunas." }, { status: 500 });
  }

  if (!candidatas || candidatas.length === 0) {
    return NextResponse.json({ processadas: 0, competencia, dia: diaDoMes });
  }

  const linhas = [];
  for (const aluna of candidatas) {
    const planos = await getPlanosVigentesDaAluna(admin, aluna.id);
    if (planos.length === 0) {
      console.warn(`[cron gerar-mensalidades] aluna ${aluna.id} sem plano vigente vinculado, pulando.`);
      continue;
    }

    const valorTotalCentavos = planos.reduce((soma, p) => soma + p.valor_centavos, 0);

    linhas.push({
      aluna_id: aluna.id,
      plano_id: planos.length === 1 ? planos[0].id : null,
      competencia,
      valor_centavos: valorTotalCentavos,
      vencimento,
      status: "pendente" as const,
    });
  }

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
