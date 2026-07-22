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
      <Label htmlFor={`foto-${tipo}`}>{label}</Label>
      {fotoAtualUrl && (
        <p className="text-xs text-muted-foreground">Foto já enviada.</p>
      )}
      <form action={handleSubmit} className="flex gap-2">
        <Input id={`foto-${tipo}`} name="foto" type="file" accept="image/*" />
        <Button type="submit" disabled={pending} variant="secondary">
          {pending ? "Enviando..." : "Enviar"}
        </Button>
      </form>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
