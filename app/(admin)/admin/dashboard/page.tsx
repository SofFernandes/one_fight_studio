import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AlunasAtivasMensal, ReceitaMensal } from "@/lib/types/database";

function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function competenciaAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const competencia = competenciaAtual();

  const [{ data: receita }, { data: ativas }] = await Promise.all([
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
  ]);

  return (
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
  );
}
