import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormPlano } from "@/components/admin/form-plano";
import { DialogAdicionarPlano } from "@/components/admin/dialog-adicionar-plano";
import { getPlanosVigentes } from "@/lib/planos";
import type { Modalidade } from "@/lib/types/database";

const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  personal: "Personal",
  grupo: "Aula em grupo",
  totalpass_wellhub: "Check-in (TotalPass/Wellhub)",
};

export default async function AdminPlanosPage() {
  const supabase = await createClient();
  const planosVigentes = await getPlanosVigentes(supabase);

  const planosPorModalidade = new Map<Modalidade, typeof planosVigentes>();
  for (const plano of planosVigentes) {
    const grupo = planosPorModalidade.get(plano.modalidade) ?? [];
    grupo.push(plano);
    planosPorModalidade.set(plano.modalidade, grupo);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Planos e valores</h1>
        <DialogAdicionarPlano />
      </div>

      {planosVigentes.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum plano cadastrado ainda. Clique em &ldquo;Adicionar plano&rdquo;
            para criar o primeiro.
          </CardContent>
        </Card>
      )}

      {[...planosPorModalidade.entries()].map(([modalidade, planos]) => (
        <Card key={modalidade} className="rounded-2xl">
          <CardHeader>
            <CardTitle>{ROTULO_MODALIDADE[modalidade]}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {planos.map((plano) => (
              <FormPlano key={plano.id} plano={plano} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
