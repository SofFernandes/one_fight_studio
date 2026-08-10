import Image from "next/image";
import { requireAluna } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAluna();
  const primeiroNome = profile.nome_completo.split(" ")[0];

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/one_fight_logo.jpg"
              alt="One Fight Studio"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="hidden font-heading text-lg font-semibold tracking-wide text-primary sm:inline">
              One Fight Studio
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="max-w-[8rem] truncate text-sm text-muted-foreground sm:max-w-none">
              {primeiroNome}
            </span>
            <ThemeToggle />
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit" className="rounded-xl">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
