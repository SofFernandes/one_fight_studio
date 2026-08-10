import type { Mensalidade } from "@/lib/types/database";

export type StatusDerivado = "pago" | "a_vencer" | "vencida" | "cancelado";

export function derivarStatus(
  mensalidade: Pick<Mensalidade, "status" | "vencimento">,
  hoje: Date = new Date()
): StatusDerivado {
  if (mensalidade.status === "pago") return "pago";
  if (mensalidade.status === "cancelado") return "cancelado";

  // status "pendente" (ou legado "vencido"): deriva pela data de vencimento.
  const vencimento = new Date(`${mensalidade.vencimento}T00:00:00`);
  const hojeSemHora = new Date(
    `${hoje.toISOString().slice(0, 10)}T00:00:00`
  );

  return vencimento < hojeSemHora ? "vencida" : "a_vencer";
}

export const rotuloStatusDerivado: Record<StatusDerivado, string> = {
  pago: "Pago",
  a_vencer: "A vencer",
  vencida: "Vencida",
  cancelado: "Cancelado",
};

export const variantStatusDerivado: Record<
  StatusDerivado,
  "default" | "destructive" | "secondary"
> = {
  pago: "default",
  a_vencer: "secondary",
  vencida: "destructive",
  cancelado: "secondary",
};
