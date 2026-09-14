import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChartMensalidades } from "@/components/admin/pie-chart-mensalidades";
import { formatarReais } from "@/lib/format";
import { derivarStatus } from "@/lib/mensalidades";
import {
  aniversarioNaSemana,
  intervaloSemana,
  proximoAniversario,
} from "@/lib/semana";
import type {
  AlunasAtivasMensal,
  Mensalidade,
  Profile,
  ReceitaMensal,
} from "@/lib/types/database";

function competenciaAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatarDataBr(data: Date) {
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatarDataIsoBr(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

type MensalidadeComAluna = Mensalidade & {
  profiles: Pick<Profile, "nome_completo" | "telefone"> | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const competencia = competenciaAtual();
  const { hoje, fimSemana } = intervaloSemana();
  const hojeIso = hoje.toISOString().slice(0, 10);
  const fimSemanaIso = fimSemana.toISOString().slice(0, 10);

  const [
    { data: receita },
    { data: ativas },
    { data: mensalidades },
    { data: vencimentosSemana },
    { data: alunas },
  ] = await Promise.all([
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
    supabase
      .from("mensalidades")
      .select("*, profiles(nome_completo, telefone)")
      .eq("status", "pendente")
      .gte("vencimento", hojeIso)
      .lte("vencimento", fimSemanaIso)
      .order("vencimento")
      .returns<MensalidadeComAluna[]>(),
    supabase
      .from("profiles")
      .select("id, nome_completo, telefone, data_nascimento")
      .eq("papel", "aluna")
      .not("data_nascimento", "is", null)
      .returns<Pick<Profile, "id" | "nome_completo" | "telefone" | "data_nascimento">[]>(),
  ]);

  const totais = { pago: 0, a_vencer: 0, vencida: 0, cancelado: 0 };
  for (const mensalidade of mensalidades ?? []) {
    const status = derivarStatus(mensalidade);
    totais[status] += mensalidade.valor_centavos;
  }

  const aniversariantesSemana = (alunas ?? [])
    .filter((aluna) => aniversarioNaSemana(aluna.data_nascimento!, hoje))
    .map((aluna) => ({
      ...aluna,
      proximaData: proximoAniversario(aluna.data_nascimento!, hoje),
    }))
    .sort((a, b) => a.proximaData.getTime() - b.proximaData.getTime());

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Aniversariantes da semana</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {aniversariantesSemana.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum aniversário nos próximos 7 dias.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aniversariantesSemana.map((aluna) => (
                    <TableRow key={aluna.id}>
                      <TableCell>{aluna.nome_completo}</TableCell>
                      <TableCell>{aluna.telefone ?? "—"}</TableCell>
                      <TableCell>{formatarDataBr(aluna.proximaData)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Vencimentos da semana</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {!vencimentosSemana || vencimentosSemana.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum vencimento nos próximos 7 dias.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Vencimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vencimentosSemana.map((mensalidade) => (
                    <TableRow key={mensalidade.id}>
                      <TableCell>
                        {mensalidade.profiles?.nome_completo ?? "—"}
                      </TableCell>
                      <TableCell>
                        {mensalidade.profiles?.telefone ?? "—"}
                      </TableCell>
                      <TableCell>
                        {formatarDataIsoBr(mensalidade.vencimento)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
