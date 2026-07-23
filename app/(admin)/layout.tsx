import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/one_fight_logo.jpg"
              alt="One Fight Studio"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="hidden text-sm font-semibold tracking-wide sm:inline">
              ONE FIGHT STUDIO — ADMIN
            </span>
          </div>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit" className="rounded-xl">
              Sair
            </Button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-4 pb-2 sm:px-6">
          <Link
            href="/admin"
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Alunas
          </Link>
          <Link
            href="/admin/planos"
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Planos
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
