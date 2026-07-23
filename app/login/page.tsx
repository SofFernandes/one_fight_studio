"use client";

import { useState } from "react";
import Image from "next/image";
import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const [estado, action, pending] = useActionState(login, undefined);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Card className="rounded-3xl border-border/60 shadow-xl shadow-black/30">
          <div className="flex flex-col items-center gap-8 text-center">
            <Image
              src="/one_fight_logo.jpg"
              alt="One Fight Studio"
              width={112}
              height={112}
              priority
              className="rounded-3xl shadow-lg shadow-black/40"
            />
            <div>
              <h1 className="text-lg font-semibold tracking-wide text-foreground">
                ONE FIGHT STUDIO
              </h1>
              <p className="text-sm text-muted-foreground">
                Entre com seu e-mail e senha
              </p>
            </div>
          </div>
          <CardContent className="pt-6 m-2">
            <form action={action} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    name="senha"
                    type={mostrarSenha ? "text" : "password"}
                    autoComplete="current-password"
                    className="h-11 rounded-xl pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    aria-label={
                      mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                    }
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
              {estado?.erro && (
                <p className="text-sm text-destructive">{estado.erro}</p>
              )}
              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full rounded-xl mt-2 text-base font-semibold"
              >
                {pending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
