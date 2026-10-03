'use client'

import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatMoney, formatMonth, METODO_PAGO_LABEL } from '@/lib/format'
import type { MetodoPago } from '@/lib/types'

const PALETTE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

const moneyTooltip = (value: unknown) => <span className="font-mono font-medium">{formatMoney(Number(value))}</span>

export function MonthlySalesChart({ data }: { data: { mes: string; total: number; ventas: number }[] }) {
  const config = { total: { label: 'Ingresos', color: 'var(--chart-1)' } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatMonth} />
        <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `$${v}`} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, p) => formatMonth(String(p?.[0]?.payload?.mes ?? ''))}
              formatter={(value, _n, item) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{`${item.payload.ventas} ventas`}</span>
                  {moneyTooltip(value)}
                </div>
              )}
            />
          }
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

export function CategoryChart({ data }: { data: { categoria: string; total: number }[] }) {
  const top = data.slice(0, 4)
  const rest = data.slice(4).reduce((acc, d) => acc + d.total, 0)
  const rows = rest > 0 ? [...top, { categoria: 'Otras', total: rest }] : top
  const config = Object.fromEntries(
    rows.map((r, i) => [`c${i}`, { label: r.categoria, color: PALETTE[i % PALETTE.length] }]),
  ) satisfies ChartConfig
  const chartData = rows.map((r, i) => ({ ...r, key: `c${i}`, fill: `var(--color-c${i})` }))
  const total = rows.reduce((acc, r) => acc + r.total, 0)

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-72 w-full">
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="key" hideLabel formatter={(v, _n, item) => (
            <div className="flex w-full justify-between gap-4">
              <span className="text-muted-foreground">{item.payload.categoria}</span>
              {moneyTooltip(v)}
            </div>
          )} />}
        />
        <Pie data={chartData} dataKey="total" nameKey="key" innerRadius={62} strokeWidth={4} stroke="var(--card)">
          {chartData.map((d) => (
            <Cell key={d.key} fill={d.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !('cx' in viewBox)) return null
              return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 8} className="fill-foreground font-mono text-base font-semibold">
                    {formatMoney(total)}
                  </tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 14} className="fill-muted-foreground text-xs">
                    ingresos
                  </tspan>
                </text>
              )
            }}
          />
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} className="flex-wrap gap-2" />
      </PieChart>
    </ChartContainer>
  )
}

export function PaymentMethodsChart({ data }: { data: { metodo_pago: MetodoPago; total: number; ventas: number }[] }) {
  const config = { total: { label: 'Ingresos', color: 'var(--chart-2)' } } satisfies ChartConfig
  const rows = data.map((d) => ({ ...d, label: METODO_PAGO_LABEL[d.metodo_pago] }))
  return (
    <ChartContainer config={config} className="aspect-auto h-48 w-full">
      <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={100} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, _n, item) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{`${item.payload.ventas} ventas`}</span>
                  {moneyTooltip(value)}
                </div>
              )}
            />
          }
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
