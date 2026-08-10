"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatarReais } from "@/lib/format";

const chartConfig: ChartConfig = {
  pago: { label: "Pagas", color: "var(--chart-1)" },
  a_vencer: { label: "A vencer", color: "var(--chart-2)" },
  vencida: { label: "Vencidas", color: "var(--color-destructive)" },
};

export function PieChartMensalidades({
  pagoCentavos,
  aVencerCentavos,
  vencidaCentavos,
}: {
  pagoCentavos: number;
  aVencerCentavos: number;
  vencidaCentavos: number;
}) {
  const dados = [
    { status: "pago", valor: pagoCentavos, fill: "var(--chart-1)" },
    { status: "a_vencer", valor: aVencerCentavos, fill: "var(--chart-2)" },
    { status: "vencida", valor: vencidaCentavos, fill: "var(--color-destructive)" },
  ].filter((item) => item.valor > 0);

  if (dados.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma mensalidade cadastrada neste mês ainda.
      </p>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="mx-auto max-h-64">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatarReais(Number(value))}
              nameKey="status"
            />
          }
        />
        <Pie data={dados} dataKey="valor" nameKey="status" innerRadius={50} />
        <ChartLegend content={<ChartLegendContent nameKey="status" />} />
      </PieChart>
    </ChartContainer>
  );
}
