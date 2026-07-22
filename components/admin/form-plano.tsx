"use client";

import { useActionState } from "react";
import { ajustarValorPlano } from "@/app/actions/planos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Modalidade, Plano } from "@/lib/types/database";

export function FormPlano({
  modalidade,
  nome,
  planoAtual,
}: {
  modalidade: Modalidade;
  nome: string;
  planoAtual: Plano | null;
}) {
  const acaoComContexto = ajustarValorPlano.bind(null, modalidade, nome);
  const [estado, action, pending] = useActionState(acaoComContexto, undefined);

  return (
    <form action={action} className="flex items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`valor-${modalidade}`}>Valor (R$)</Label>
        <Input
          id={`valor-${modalidade}`}
          name="valor"
          type="text"
          defaultValue={
            planoAtual ? (planoAtual.valor_centavos / 100).toFixed(2) : ""
          }
          placeholder="0,00"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Atualizar"}
      </Button>
      {estado?.erro && (
        <p className="text-sm text-destructive">{estado.erro}</p>
      )}
      {estado?.sucesso && (
        <p className="text-sm text-emerald-600">Atualizado!</p>
      )}
    </form>
  );
}
