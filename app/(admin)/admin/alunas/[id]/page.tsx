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
import { LinhaTempoProgresso } from "@/components/portal/linha-tempo-progresso";
import { getPlanosVigentes, getPlanosVigentesDaAluna } from "@/lib/planos";
import { getUrlAssinadaFoto } from "@/lib/storage";
import type { Mensalidade, Profile, RegistroProgresso } from "@/lib/types/database";

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

  const [{ data: mensalidade }, planosDisponiveis, planosVinculados, { data: registros }] =
    await Promise.all([
      supabase
        .from("mensalidades")
        .select("*")
        .eq("aluna_id", id)
        .eq("competencia", competenciaAtual())
        .maybeSingle<Mensalidade>(),
      getPlanosVigentes(supabase),
      getPlanosVigentesDaAluna(supabase, id),
      supabase
        .from("registros_progresso")
        .select("*")
        .eq("aluna_id", id)
        .order("data_registro", { ascending: false })
        .order("criado_em", { ascending: false })
        .returns<RegistroProgresso[]>(),
    ]);

  const registrosComFoto = await Promise.all(
    (registros ?? []).map(async (registro) => ({
      ...registro,
      urlFoto: registro.foto_url
        ? await getUrlAssinadaFoto(supabase, registro.foto_url)
        : null,
    }))
  );

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

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <LinhaTempoProgresso registros={registrosComFoto} />
        </CardContent>
      </Card>
    </div>
  );
}
