"use client";

import { useState, useTransition } from "react";
import { alterarPapelUsuarioAdmin } from "@/app/actions/usuarios";
import { Button } from "@/components/ui/button";
import type { Papel } from "@/lib/types/database";

export function BotaoAlternarPapel({
  userId,
  papelAtual,
}: {
  userId: string;
  papelAtual: Papel;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const novoPapel: Papel = papelAtual === "admin" ? "aluna" : "admin";

  function handleClick() {
    setErro(null);
    startTransition(async () => {
      const resultado = await alterarPapelUsuarioAdmin(userId, novoPapel);
      if (resultado?.erro) setErro(resultado.erro);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="rounded-xl"
        disabled={pending}
        onClick={handleClick}
      >
        {pending
          ? "Salvando..."
          : papelAtual === "admin"
            ? "Tornar aluna"
            : "Tornar admin"}
      </Button>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
