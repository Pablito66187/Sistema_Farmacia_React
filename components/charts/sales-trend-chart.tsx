'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatMoney, formatShortDay } from '@/lib/format'

const config = {
  total: { label: 'Ventas', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function SalesTrendChart({ data }: { data: { dia: string; total: number; ventas: number }[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="dia"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={formatShortDay}
        />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `$${v}`} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => formatShortDay(String(payload?.[0]?.payload?.dia ?? ''))}
              formatter={(value, _name, item) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{`${item.payload.ventas} ventas`}</span>
                  <span className="font-mono font-medium">{formatMoney(Number(value))}</span>
                </div>
              )}
            />
          }
        />
        <Area dataKey="total" type="monotone" stroke="var(--color-total)" strokeWidth={2} fill="url(#fillTotal)" />
      </AreaChart>
    </ChartContainer>
  )
}
