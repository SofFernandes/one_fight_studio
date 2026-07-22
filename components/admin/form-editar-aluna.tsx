"use client";

import { useActionState } from "react";
import { atualizarAlunaAdmin } from "@/app/actions/admin";
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
import type { Profile } from "@/lib/types/database";

export function FormEditarAluna({ profile }: { profile: Profile }) {
  const acaoComId = atualizarAlunaAdmin.bind(null, profile.id);
  const [estado, action, pending] = useActionState(acaoComId, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nome_completo">Nome completo</Label>
        <Input
          id="nome_completo"
          name="nome_completo"
          defaultValue={profile.nome_completo}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
        <Input
          id="telefone"
          name="telefone"
          placeholder="+5511999999999"
          defaultValue={profile.telefone ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="data_nascimento">Data de nascimento</Label>
        <Input
          id="data_nascimento"
          name="data_nascimento"
          type="date"
          defaultValue={profile.data_nascimento ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="modalidade">Modalidade</Label>
        <Select name="modalidade" defaultValue={profile.modalidade ?? ""}>
          <SelectTrigger id="modalidade">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="grupo">Aula em grupo</SelectItem>
            <SelectItem value="totalpass_wellhub">
              Check-in (TotalPass/Wellhub)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {estado?.erro && (
        <p className="text-sm text-destructive">{estado.erro}</p>
      )}
      {estado?.sucesso && (
        <p className="text-sm text-emerald-600">Dados salvos!</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar dados"}
      </Button>
    </form>
  );
}
