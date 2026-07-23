import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AlunasAtivasMensal,
  Mensalidade,
  Profile,
  ReceitaMensal,
} from "@/lib/types/database";

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

const rotuloModalidade: Record<string, string> = {
  personal: "Personal",
  grupo: "Grupo",
  totalpass_wellhub: "TotalPass/Wellhub",
};

export default async function AdminAlunasPage() {
  const supabase = await createClient();
  const competencia = competenciaAtual();

  const [{ data: alunas }, { data: receita }, { data: ativas }, { data: mensalidades }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("papel", "aluna")
        .order("nome_completo")
        .returns<Profile[]>(),
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

  const mensalidadePorAluna = new Map(
    (mensalidades ?? []).map((m) => [m.aluna_id, m])
  );

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
          <CardTitle>Alunas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(alunas ?? []).map((aluna) => {
                const mensalidade = mensalidadePorAluna.get(aluna.id);
                return (
                  <TableRow key={aluna.id}>
                    <TableCell>{aluna.nome_completo}</TableCell>
                    <TableCell>
                      {aluna.modalidade
                        ? rotuloModalidade[aluna.modalidade]
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {mensalidade
                        ? new Date(
                            `${mensalidade.vencimento}T00:00:00`
                          ).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {mensalidade ? (
                        <Badge
                          variant={
                            mensalidade.status === "pago"
                              ? "default"
                              : mensalidade.status === "vencido"
                                ? "destructive"
                                : "secondary"
                          }
                          className="rounded-full px-2.5"
                        >
                          {mensalidade.status}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/alunas/${aluna.id}`}
                        className="whitespace-nowrap text-sm font-medium text-primary hover:underline"
                      >
                        Editar
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
