import { requireAluna } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormDadosPessoais } from "@/components/portal/form-dados-pessoais";
import { FormRegistroProgresso } from "@/components/portal/form-registro-progresso";
import { LinhaTempoProgresso } from "@/components/portal/linha-tempo-progresso";
import { getPlanosVigentesDaAluna } from "@/lib/planos";
import { getUrlAssinadaFoto } from "@/lib/storage";
import type { Mensalidade, RegistroProgresso } from "@/lib/types/database";

function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

const rotuloStatus: Record<Mensalidade["status"], string> = {
  pago: "Pago",
  pendente: "Pendente",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

const corStatus: Record<Mensalidade["status"], "default" | "destructive" | "secondary"> = {
  pago: "default",
  pendente: "secondary",
  vencido: "destructive",
  cancelado: "secondary",
};

export default async function PerfilPage() {
  const profile = await requireAluna();
  const supabase = await createClient();

  const [{ data: mensalidade }, planosVinculados, { data: registros }] =
    await Promise.all([
      supabase
        .from("mensalidades")
        .select("*")
        .eq("aluna_id", profile.id)
        .order("competencia", { ascending: false })
        .limit(1)
        .maybeSingle<Mensalidade>(),
      getPlanosVigentesDaAluna(supabase, profile.id),
      supabase
        .from("registros_progresso")
        .select("*")
        .eq("aluna_id", profile.id)
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
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Mensalidade</CardTitle>
        </CardHeader>
        <CardContent>
          {mensalidade ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Vencimento: {formatarData(mensalidade.vencimento)}
                </p>
                <p className="text-2xl font-semibold text-primary">
                  {formatarReais(mensalidade.valor_centavos)}
                </p>
              </div>
              <Badge
                variant={corStatus[mensalidade.status]}
                className="rounded-full px-3 py-1"
              >
                {rotuloStatus[mensalidade.status]}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma mensalidade cadastrada ainda.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Meus planos</CardTitle>
        </CardHeader>
        <CardContent>
          {planosVinculados.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {planosVinculados.map((plano) => (
                <Badge
                  key={plano.id}
                  variant="secondary"
                  className="rounded-full px-3 py-1"
                >
                  {plano.nome}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum plano vinculado ainda. Fale com a administração.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <FormDadosPessoais profile={profile} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Progresso</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FormRegistroProgresso />
          <LinhaTempoProgresso registros={registrosComFoto} />
        </CardContent>
      </Card>
    </div>
  );
}
