"use client";

import { useRef, useState, useTransition } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { alterarSenhaUsuarioAdmin } from "@/app/actions/usuarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DialogAlterarSenha({
  userId,
  nomeCompleto,
}: {
  userId: string;
  nomeCompleto: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const resultado = await alterarSenhaUsuarioAdmin(userId, undefined, formData);
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
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="rounded-xl" />}
      >
        <KeyRound className="size-4" />
        Trocar senha
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Trocar senha de {nomeCompleto}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="senha">Nova senha</Label>
            <div className="relative">
              <Input
                id="senha"
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="mínimo 6 caracteres"
                className="h-11 rounded-xl pr-11"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {mostrarSenha ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button
            type="submit"
            disabled={pending}
            className="h-11 rounded-xl font-semibold"
          >
            {pending ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
