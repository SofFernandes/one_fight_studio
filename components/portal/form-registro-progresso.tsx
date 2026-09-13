"use client";

import { useRef, useState, useTransition } from "react";
import { adicionarRegistroProgresso } from "@/app/actions/progresso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormRegistroProgresso() {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const hoje = new Date().toISOString().slice(0, 10);

  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const resultado = await adicionarRegistroProgresso(undefined, formData);
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border/60 p-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="data_registro">Data</Label>
          <Input
            id="data_registro"
            name="data_registro"
            type="date"
            defaultValue={hoje}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="peso">Peso (kg)</Label>
          <Input
            id="peso"
            name="peso"
            type="text"
            placeholder="ex: 62,5"
            className="h-11 rounded-xl"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="altura">Altura (cm)</Label>
          <Input
            id="altura"
            name="altura"
            type="text"
            placeholder="ex: 165"
            className="h-11 rounded-xl"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="foto">Foto (opcional)</Label>
        <Input
          id="foto"
          name="foto"
          type="file"
          accept="image/*"
          className="h-11 rounded-xl file:h-full file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:text-secondary-foreground"
        />
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Button
        type="submit"
        disabled={pending}
        className="h-11 rounded-xl font-semibold"
      >
        {pending ? "Salvando..." : "Adicionar registro"}
      </Button>
    </form>
  );
}
