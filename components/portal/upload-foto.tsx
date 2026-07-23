"use client";

import { useState, useTransition } from "react";
import { enviarFoto } from "@/app/actions/perfil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UploadFoto({
  tipo,
  label,
  fotoAtualUrl,
}: {
  tipo: "antes" | "atual";
  label: string;
  fotoAtualUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const resultado = await enviarFoto(tipo, formData);
      if (resultado?.erro) setErro(resultado.erro);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={`foto-${tipo}`}>{label}</Label>
        {fotoAtualUrl && (
          <span className="text-xs text-emerald-400">Foto enviada ✓</span>
        )}
      </div>
      <form
        action={handleSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Input
          id={`foto-${tipo}`}
          name="foto"
          type="file"
          accept="image/*"
          className="h-11 flex-1 rounded-xl file:h-full file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:text-secondary-foreground"
        />
        <Button
          type="submit"
          disabled={pending}
          variant="secondary"
          className="h-11 rounded-xl sm:w-28"
        >
          {pending ? "Enviando..." : "Enviar"}
        </Button>
      </form>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
