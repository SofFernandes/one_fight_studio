import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogAdicionarAdmin } from "@/components/admin/dialog-adicionar-admin";
import { DialogAlterarSenha } from "@/components/admin/dialog-alterar-senha";
import { BotaoAlternarPapel } from "@/components/admin/botao-alternar-papel";
import type { Profile } from "@/lib/types/database";

export default async function AdminConfiguracoesPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: usuarios }, { data: listaAuth }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("nome_completo")
      .returns<Profile[]>(),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailPorId = new Map(
    (listaAuth?.users ?? []).map((u) => [u.id, u.email ?? "—"])
  );

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Usuários</CardTitle>
        <DialogAdicionarAdmin />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(usuarios ?? []).map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>{usuario.nome_completo}</TableCell>
                <TableCell>{emailPorId.get(usuario.id) ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={usuario.papel === "admin" ? "default" : "secondary"}
                    className="rounded-full px-2.5"
                  >
                    {usuario.papel === "admin" ? "Admin" : "Aluna"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <DialogAlterarSenha
                      userId={usuario.id}
                      nomeCompleto={usuario.nome_completo}
                    />
                    <BotaoAlternarPapel
                      userId={usuario.id}
                      papelAtual={usuario.papel}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
