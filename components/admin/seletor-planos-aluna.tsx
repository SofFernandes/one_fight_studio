"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Modalidade, Plano } from "@/lib/types/database";

const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  personal: "Personal",
  grupo: "Aula em grupo",
  totalpass_wellhub: "Check-in (TotalPass/Wellhub)",
};

function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function SeletorPlanosAluna({
  planosDisponiveis,
  planosVinculadosIds,
}: {
  planosDisponiveis: Plano[];
  planosVinculadosIds: string[];
}) {
  const [selecionados, setSelecionados] = useState(new Set(planosVinculadosIds));

  function alternar(planoId: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(planoId)) novo.delete(planoId);
      else novo.add(planoId);
      return novo;
    });
  }

  const planosPorModalidade = new Map<Modalidade, Plano[]>();
  for (const plano of planosDisponiveis) {
    const grupo = planosPorModalidade.get(plano.modalidade) ?? [];
    grupo.push(plano);
    planosPorModalidade.set(plano.modalidade, grupo);
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>Planos vinculados</Label>
      {planosDisponiveis.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum plano cadastrado ainda em /admin/planos.
        </p>
      )}
      {[...planosPorModalidade.entries()].map(([modalidade, planos]) => (
        <div key={modalidade} className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            {ROTULO_MODALIDADE[modalidade]}
          </span>
          <div className="flex flex-wrap gap-2">
            {planos.map((plano) => {
              const marcado = selecionados.has(plano.id);
              return (
                <button
                  key={plano.id}
                  type="button"
                  onClick={() => alternar(plano.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    marcado
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-foreground hover:bg-accent"
                  )}
                >
                  {plano.nome} · {formatarReais(plano.valor_centavos)}
                  <input
                    type="checkbox"
                    name="planos"
                    value={plano.id}
                    checked={marcado}
                    readOnly
                    className="hidden"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
