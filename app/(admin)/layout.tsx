import { requireAdmin } from "@/lib/dal";
import Navbar from "@/components/admin/navbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
