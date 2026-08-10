"use client";

import { useActionState } from "react";
import { atualizarMensalidadeAdmin } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Mensalidade } from "@/lib/types/database";

export function FormEditarMensalidade({
  mensalidade,
  alunaId,
}: {
  mensalidade: Mensalidade;
  alunaId: string;
}) {
  const acaoComIds = atualizarMensalidadeAdmin.bind(
    null,
    mensalidade.id,
    alunaId
  );
  const [estado, action, pending] = useActionState(acaoComIds, undefined);

  return (
    <form
      key={`${mensalidade.vencimento}-${mensalidade.valor_centavos}-${mensalidade.status}`}
      action={action}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="vencimento">Vencimento</Label>
        <Input
          id="vencimento"
          name="vencimento"
          type="date"
          defaultValue={mensalidade.vencimento}
          className="h-11 rounded-xl"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="valor">Valor (R$)</Label>
        <Input
          id="valor"
          name="valor"
          type="text"
          defaultValue={(mensalidade.valor_centavos / 100).toFixed(2)}
          className="h-11 rounded-xl"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={mensalidade.status}>
          <SelectTrigger id="status" className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {estado?.erro && (
        <p className="text-sm text-destructive">{estado.erro}</p>
      )}
      {estado?.sucesso && (
        <p className="text-sm text-emerald-400">Mensalidade atualizada!</p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="h-11 rounded-xl font-semibold"
      >
        {pending ? "Salvando..." : "Salvar mensalidade"}
      </Button>
    </form>
  );
}
