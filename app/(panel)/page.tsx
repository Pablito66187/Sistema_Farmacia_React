import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { SalesTrendChart } from '@/components/charts/sales-trend-chart'
import { TopProductsChart } from '@/components/charts/top-products-chart'
import { PageHeader, Panel, StatCard } from '@/components/page-header'
import { SalesTable } from '@/components/sales-table'
import { daysUntil, ExpiryLabel, StockBadge } from '@/components/stock-badge'
import { buttonVariants } from '@/components/ui/button'
import { formatDate, formatInt, formatMoney } from '@/lib/format'
import { getDashboard, getToday } from '@/lib/queries'

export default async function DashboardPage() {
  const [data, today] = await Promise.all([getDashboard(), getToday()])
  const total30 = data.serie.reduce((acc, d) => acc + d.total, 0)

  return (
    <>
      <PageHeader title="Panel general" description={`Resumen de operaciones al ${formatDate(today)}`}>
        <Link href="/ventas" className={buttonVariants()}>
          <ShoppingCart />
          Nueva venta
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ventas de hoy" value={formatMoney(data.hoy.total)} hint={`${data.hoy.ventas} transacciones`} />
        <StatCard label="Ventas del mes" value={formatMoney(data.mes.total)} hint={`${data.mes.ventas} transacciones`} />
        <StatCard
          label="Valor del inventario"
          value={formatMoney(data.inventario.valor)}
          hint={`${formatInt(data.inventario.unidades)} unidades · ${data.inventario.productos} productos`}
        />
        <StatCard
          label="Stock bajo"
          value={String(data.stockBajo)}
          hint="productos por reponer"
          tone={data.stockBajo > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel
          title="Ventas · últimos 30 días"
          description={`Total del periodo: ${formatMoney(total30)}`}
          className="lg:col-span-3"
        >
          <SalesTrendChart data={data.serie} />
        </Panel>
        <Panel title="Más vendidos" description="Unidades, últimos 30 días" className="lg:col-span-2">
          {data.top.length ? (
            <TopProductsChart data={data.top} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin ventas en el periodo.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Alertas de inventario"
          description="Stock bajo o vencimiento en menos de 60 días"
          action={
            <Link href="/inventario?estado=bajo" className="text-sm font-medium text-primary hover:underline">
              Ver todo
            </Link>
          }
        >
          {data.alertas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Todo en orden.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {data.alertas.map((p) => {
                const days = daysUntil(p.fecha_vencimiento, today)
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{p.nombre}</span>
                      <span className="font-mono text-xs text-muted-foreground">{p.codigo}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs">
                      <ExpiryLabel days={days} />
                      <StockBadge stock={p.stock} minimo={p.stock_minimo} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
        <Panel
          title="Últimas ventas"
          action={
            <Link href="/ventas" className="text-sm font-medium text-primary hover:underline">
              Historial
            </Link>
          }
        >
          <SalesTable ventas={data.ultimas} compact />
        </Panel>
      </div>
    </>
  )
}
