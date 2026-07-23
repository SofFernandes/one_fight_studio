import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormPlano } from "@/components/admin/form-plano";
import type { Modalidade, Plano } from "@/lib/types/database";

const PLANOS_CONFIGURAVEIS: { modalidade: Modalidade; nome: string; titulo: string }[] = [
  { modalidade: "personal", nome: "Personal", titulo: "Personal" },
  { modalidade: "grupo", nome: "Aula em grupo", titulo: "Aula em grupo" },
];

export default async function AdminPlanosPage() {
  const supabase = await createClient();

  const { data: planosVigentes } = await supabase
    .from("planos")
    .select("*")
    .is("vigencia_fim", null)
    .returns<Plano[]>();

  const planoPorModalidade = new Map(
    (planosVigentes ?? []).map((p) => [p.modalidade, p])
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Planos e valores</h1>
      {PLANOS_CONFIGURAVEIS.map(({ modalidade, nome, titulo }) => (
        <Card key={modalidade} className="rounded-2xl">
          <CardHeader>
            <CardTitle>{titulo}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormPlano
              modalidade={modalidade}
              nome={nome}
              planoAtual={planoPorModalidade.get(modalidade) ?? null}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
