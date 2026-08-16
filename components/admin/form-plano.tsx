"use client";

import { useActionState } from "react";
import { ajustarValorPlano } from "@/app/actions/planos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Plano } from "@/lib/types/database";

export function FormPlano({ plano }: { plano: Plano }) {
  const acaoComId = ajustarValorPlano.bind(null, plano.id);
  const [estado, action, pending] = useActionState(acaoComId, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor={`valor-${plano.id}`}>{plano.nome} — Valor (R$)</Label>
          <Input
            key={plano.id}
            id={`valor-${plano.id}`}
            name="valor"
            type="text"
            defaultValue={(plano.valor_centavos / 100).toFixed(2)}
            placeholder="0,00"
            className="h-11 rounded-xl"
            required
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
          className="h-11 rounded-xl font-semibold sm:w-32"
        >
          {pending ? "Salvando..." : "Atualizar"}
        </Button>
      </div>
      {estado?.erro && (
        <p className="text-sm text-destructive">{estado.erro}</p>
      )}
      {estado?.sucesso && (
        <p className="text-sm text-emerald-400">Atualizado!</p>
      )}
    </form>
  );
}
