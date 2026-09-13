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
import { DialogAdicionarAluna } from "@/components/admin/dialog-adicionar-aluna";
import {
  derivarStatus,
  rotuloStatusDerivado,
  variantStatusDerivado,
} from "@/lib/mensalidades";
import { getPlanosVigentes } from "@/lib/planos";
import type { Mensalidade, Plano, Profile } from "@/lib/types/database";

function competenciaAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function AdminAlunasPage() {
  const supabase = await createClient();
  const competencia = competenciaAtual();

  const [{ data: alunas }, { data: mensalidades }, planosDisponiveis, { data: vinculos }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("papel", "aluna")
        .order("nome_completo")
        .returns<Profile[]>(),
      supabase
        .from("mensalidades")
        .select("*")
        .eq("competencia", competencia)
        .returns<Mensalidade[]>(),
      getPlanosVigentes(supabase),
      supabase.from("aluna_planos").select("aluna_id, planos(*)"),
    ]);

  const mensalidadePorAluna = new Map(
    (mensalidades ?? []).map((m) => [m.aluna_id, m])
  );

  const planosPorAluna = new Map<string, Plano[]>();
  for (const vinculo of vinculos ?? []) {
    const plano = vinculo.planos as unknown as Plano | null;
    if (!plano) continue;
    const grupo = planosPorAluna.get(vinculo.aluna_id) ?? [];
    grupo.push(plano);
    planosPorAluna.set(vinculo.aluna_id, grupo);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Alunas</CardTitle>
        <DialogAdicionarAluna planosDisponiveis={planosDisponiveis} />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Planos</TableHead>
              <TableHead>Dia venc.</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(alunas ?? []).map((aluna) => {
              const mensalidade = mensalidadePorAluna.get(aluna.id);
              const statusDerivado = mensalidade
                ? derivarStatus(mensalidade)
                : null;
              const planosDaAluna = planosPorAluna.get(aluna.id) ?? [];
              return (
                <TableRow key={aluna.id}>
                  <TableCell>{aluna.nome_completo}</TableCell>
                  <TableCell>
                    {planosDaAluna.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {planosDaAluna.map((plano) => (
                          <Badge
                            key={plano.id}
                            variant="secondary"
                            className="rounded-full px-2.5"
                          >
                            {plano.nome}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{aluna.dia_vencimento ?? "—"}</TableCell>
                  <TableCell>
                    {mensalidade
                      ? new Date(
                          `${mensalidade.vencimento}T00:00:00`
                        ).toLocaleDateString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {statusDerivado ? (
                      <Badge
                        variant={variantStatusDerivado[statusDerivado]}
                        className="rounded-full px-2.5"
                      >
                        {rotuloStatusDerivado[statusDerivado]}
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
  );
}
