'use client'

import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const config = {
  unidades: { label: 'Unidades', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function TopProductsChart({ data }: { data: { nombre: string; unidades: number }[] }) {
  const rows = data.map((d) => ({ ...d, corto: d.nombre.length > 20 ? `${d.nombre.slice(0, 19)}…` : d.nombre }))
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 32 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="corto" type="category" tickLine={false} axisLine={false} width={150} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent labelFormatter={(_, p) => String(p?.[0]?.payload?.nombre ?? '')} />}
        />
        <Bar dataKey="unidades" fill="var(--color-unidades)" radius={4}>
          <LabelList dataKey="unidades" position="right" className="fill-foreground font-mono" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
