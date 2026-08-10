import Image from "next/image";
import { requireAdmin } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks } from "@/components/admin/nav-links";

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
          <span className="hidden font-heading text-lg font-semibold tracking-wide text-primary sm:inline">
            One Fight Studio — Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={logout}>
            <Button variant="ghost" size="lg" type="submit" className="rounded-xl">
              Sair
            </Button>
          </form>
        </div>
      </div>
      <NavLinks />
    </header>
  );
}
