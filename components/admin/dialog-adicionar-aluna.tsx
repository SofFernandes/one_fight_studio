"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { criarAlunaAdmin } from "@/app/actions/admin";
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

export function DialogAdicionarAluna() {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const resultado = await criarAlunaAdmin(undefined, formData);
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
        Adicionar aluna
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova aluna</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome_completo">Nome completo</Label>
            <Input
              id="nome_completo"
              name="nome_completo"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="senha">Senha temporária</Label>
            <Input
              id="senha"
              name="senha"
              type="text"
              placeholder="mínimo 6 caracteres"
              className="h-11 rounded-xl"
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Informe essa senha para a aluna pessoalmente.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
            <Input
              id="telefone"
              name="telefone"
              placeholder="+5511999999999"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="data_nascimento">Data de nascimento</Label>
            <Input
              id="data_nascimento"
              name="data_nascimento"
              type="date"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Label htmlFor="modalidade">Modalidade</Label>
            <Select name="modalidade">
              <SelectTrigger id="modalidade" className="h-11 rounded-xl">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="grupo">Aulas Coletivas</SelectItem>
                <SelectItem value="totalpass_wellhub">
                  Check-in (TotalPass/Wellhub)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button
            type="submit"
            disabled={pending}
            className="h-11 rounded-xl font-semibold"
          >
            {pending ? "Criando..." : "Criar aluna"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
