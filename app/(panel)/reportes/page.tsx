import { CategoryChart, MonthlySalesChart, PaymentMethodsChart } from '@/components/charts/report-charts'
import { PageHeader, Panel, StatCard } from '@/components/page-header'
import { ReportToolbar } from '@/components/reportes/report-toolbar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatInt, formatMoney, METODO_PAGO_LABEL } from '@/lib/format'
import { getReporte, getToday, isValidDate } from '@/lib/queries'

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}) {
  const sp = await searchParams
  const today = await getToday()
  const defaultDesde = new Date(`${today}T12:00:00Z`)
  defaultDesde.setUTCDate(defaultDesde.getUTCDate() - 182)

  let desde = isValidDate(sp.desde) ? sp.desde : defaultDesde.toISOString().slice(0, 10)
  let hasta = isValidDate(sp.hasta) ? sp.hasta : today
  if (desde > hasta) [desde, hasta] = [hasta, desde]

  const reporte = await getReporte(desde, hasta)
  const { resumen } = reporte
  const margen = resumen.total ? (resumen.ganancia / resumen.total) * 100 : 0

  return (
    <>
      <PageHeader
        title="Reportes"
        description={`Periodo del ${formatDate(desde)} al ${formatDate(hasta)}`}
      />
      <ReportToolbar desde={desde} hasta={hasta} today={today} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ingresos" value={formatMoney(resumen.total)} hint={`${formatInt(resumen.ventas)} ventas`} />
        <StatCard
          label="Ganancia bruta"
          value={formatMoney(resumen.ganancia)}
          hint={`Margen ${margen.toFixed(1)}%`}
        />
        <StatCard label="Ticket promedio" value={formatMoney(resumen.ticketPromedio)} hint="por transacción" />
        <StatCard label="Unidades vendidas" value={formatInt(resumen.unidades)} hint="medicamentos e insumos" />
      </div>

      {resumen.ventas === 0 ? (
        <p className="rounded-lg border border-dashed bg-card py-16 text-center text-muted-foreground">
          No hay ventas registradas en este periodo.
        </p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-5">
            <Panel title="Ingresos por mes" className="lg:col-span-3">
              <MonthlySalesChart data={reporte.porMes} />
            </Panel>
            <Panel title="Ventas por categoría" className="lg:col-span-2">
              <CategoryChart data={reporte.porCategoria} />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Panel title="Productos más rentables" description="Top 10 por ingresos" className="lg:col-span-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Uds.</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Ganancia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reporte.topProductos.map((p) => (
                    <TableRow key={p.codigo}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.nombre}</span>
                          <span className="font-mono text-xs text-muted-foreground">{p.codigo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatInt(p.unidades)}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney(p.ingresos)}</TableCell>
                      <TableCell className="hidden text-right font-mono text-primary sm:table-cell">
                        {formatMoney(p.ganancia)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
            <Panel title="Métodos de pago" className="lg:col-span-2">
              <PaymentMethodsChart data={reporte.porMetodo} />
              <ul className="flex flex-col divide-y text-sm">
                {reporte.porMetodo.map((m) => (
                  <li key={m.metodo_pago} className="flex justify-between py-2">
                    <span>{METODO_PAGO_LABEL[m.metodo_pago]}</span>
                    <span className="font-mono">
                      {`${resumen.total ? ((m.total / resumen.total) * 100).toFixed(1) : '0'}%`}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </>
  )
}
