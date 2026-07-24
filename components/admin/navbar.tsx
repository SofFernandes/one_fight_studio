import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/alunas", label: "Alunas" },
  { href: "/admin/planos", label: "Planos" },
];

export default async function Navbar() {
  await requireAdmin();

  return (
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
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
