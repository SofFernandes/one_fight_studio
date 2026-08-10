import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChartMensalidades } from "@/components/admin/pie-chart-mensalidades";
import { formatarReais } from "@/lib/format";
import { derivarStatus } from "@/lib/mensalidades";
import type {
  AlunasAtivasMensal,
  Mensalidade,
  ReceitaMensal,
} from "@/lib/types/database";

function competenciaAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const competencia = competenciaAtual();

  const [{ data: receita }, { data: ativas }, { data: mensalidades }] =
    await Promise.all([
      supabase
        .from("receita_mensal")
        .select("*")
        .eq("competencia", competencia)
        .maybeSingle<ReceitaMensal>(),
      supabase
        .from("alunas_ativas_mensal")
        .select("*")
        .eq("competencia", competencia)
        .maybeSingle<AlunasAtivasMensal>(),
      supabase
        .from("mensalidades")
        .select("*")
        .eq("competencia", competencia)
        .returns<Mensalidade[]>(),
    ]);

  const totais = { pago: 0, a_vencer: 0, vencida: 0, cancelado: 0 };
  for (const mensalidade of mensalidades ?? []) {
    const status = derivarStatus(mensalidade);
    totais[status] += mensalidade.valor_centavos;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Receita do mês (paga)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">
              {formatarReais(receita?.receita_paga_centavos ?? 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              Em aberto: {formatarReais(receita?.receita_em_aberto_centavos ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Alunas ativas no mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">
              {ativas?.alunas_ativas ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Mensalidades do mês por status</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChartMensalidades
            pagoCentavos={totais.pago}
            aVencerCentavos={totais.a_vencer}
            vencidaCentavos={totais.vencida}
          />
        </CardContent>
      </Card>
    </div>
  );
}
