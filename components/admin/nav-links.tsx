"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/alunas", label: "Alunas" },
  { href: "/admin/planos", label: "Planos" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-5xl gap-1 px-4 pb-2 sm:px-6">
      {LINKS.map(({ href, label }) => {
        const ativo = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-full px-3 py-1.5 text-base font-bold transition-colors hover:bg-accent focus:bg-accent focus:outline-none",
              ativo
                ? "bg-secondary text-secondary-foreground"
                : "text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
