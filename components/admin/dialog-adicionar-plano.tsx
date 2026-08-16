"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { criarPlanoAdmin } from "@/app/actions/planos";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DialogAdicionarPlano() {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const resultado = await criarPlanoAdmin(undefined, formData);
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      formRef.current?.reset();
      setAberto(false);
    });
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        setAberto(valor);
        if (!valor) setErro(null);
      }}
    >
      <DialogTrigger render={<Button className="rounded-xl font-semibold" />}>
        <Plus className="size-4" />
        Adicionar plano
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo plano</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome do plano</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="ex: Personal 2x/semana"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="modalidade">Modalidade</Label>
            <Select name="modalidade" required>
              <SelectTrigger id="modalidade" className="h-11 rounded-xl">
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              name="valor"
              type="text"
              placeholder="0,00"
              className="h-11 rounded-xl"
              required
            />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button
            type="submit"
            disabled={pending}
            className="h-11 rounded-xl font-semibold"
          >
            {pending ? "Criando..." : "Criar plano"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
