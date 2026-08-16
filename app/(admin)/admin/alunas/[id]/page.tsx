import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormEditarAluna } from "@/components/admin/form-editar-aluna";
import { FormEditarMensalidade } from "@/components/admin/form-editar-mensalidade";
import { getPlanosVigentes, getPlanosVigentesDaAluna } from "@/lib/planos";
import type { Mensalidade, Profile } from "@/lib/types/database";

function competenciaAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function EditarAlunaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: aluna } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single<Profile>();

  if (!aluna) notFound();

  const [{ data: mensalidade }, planosDisponiveis, planosVinculados] =
    await Promise.all([
      supabase
        .from("mensalidades")
        .select("*")
        .eq("aluna_id", id)
        .eq("competencia", competenciaAtual())
        .maybeSingle<Mensalidade>(),
      getPlanosVigentes(supabase),
      getPlanosVigentesDaAluna(supabase, id),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{aluna.nome_completo}</h1>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <FormEditarAluna
            profile={aluna}
            planosDisponiveis={planosDisponiveis}
            planosVinculadosIds={planosVinculados.map((p) => p.id)}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Mensalidade do mês</CardTitle>
        </CardHeader>
        <CardContent>
          {mensalidade ? (
            <FormEditarMensalidade mensalidade={mensalidade} alunaId={id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma mensalidade cadastrada para este mês ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
