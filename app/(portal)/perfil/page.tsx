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
import { UploadFoto } from "@/components/portal/upload-foto";
import type { Mensalidade } from "@/lib/types/database";

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

  const { data: mensalidade } = await supabase
    .from("mensalidades")
    .select("*")
    .eq("aluna_id", profile.id)
    .order("competencia", { ascending: false })
    .limit(1)
    .maybeSingle<Mensalidade>();

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
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <FormDadosPessoais profile={profile} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Fotos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <UploadFoto
            tipo="antes"
            label="Foto antes"
            fotoAtualUrl={profile.foto_antes_url}
          />
          <UploadFoto
            tipo="atual"
            label="Foto atual"
            fotoAtualUrl={profile.foto_atual_url}
          />
        </CardContent>
      </Card>
    </div>
  );
}
