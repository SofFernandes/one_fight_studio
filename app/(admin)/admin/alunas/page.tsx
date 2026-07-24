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
import type { Mensalidade, Profile } from "@/lib/types/database";

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

  const [{ data: alunas }, { data: mensalidades }] = await Promise.all([
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
  ]);

  const mensalidadePorAluna = new Map(
    (mensalidades ?? []).map((m) => [m.aluna_id, m])
  );

  return (
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
  );
}
