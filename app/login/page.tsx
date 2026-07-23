"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const [estado, action, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
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

        <Card className="rounded-3xl border-border/60 shadow-xl shadow-black/30">
          <CardContent className="pt-6">
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
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              {estado?.erro && (
                <p className="text-sm text-destructive">{estado.erro}</p>
              )}
              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full rounded-xl text-base font-semibold"
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
