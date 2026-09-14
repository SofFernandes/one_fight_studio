import Image from "next/image";
import type { RegistroProgresso } from "@/lib/types/database";

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

export function LinhaTempoProgresso({
  registros,
}: {
  registros: (RegistroProgresso & { urlFoto: string | null })[];
}) {
  if (registros.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum registro de progresso ainda.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {registros.map((registro) => (
        <li
          key={registro.id}
          className="flex gap-4 rounded-2xl border border-border/60 p-3"
        >
          {registro.urlFoto ? (
            <Image
              src={registro.urlFoto}
              alt={`Registro de ${formatarData(registro.data_registro)}`}
              width={96}
              height={96}
              className="size-24 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">
              Sem foto
            </div>
          )}
          <div className="flex flex-col justify-center gap-1">
            <p className="text-sm font-semibold text-foreground">
              {formatarData(registro.data_registro)}
            </p>
            {registro.peso_kg !== null && (
              <p className="text-sm text-muted-foreground">
                Peso: {registro.peso_kg} kg
              </p>
            )}
            {registro.altura_cm !== null && (
              <p className="text-sm text-muted-foreground">
                Altura: {registro.altura_cm} cm
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
