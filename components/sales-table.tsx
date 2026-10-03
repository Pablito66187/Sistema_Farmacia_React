import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime, formatMoney, METODO_PAGO_LABEL } from '@/lib/format'
import type { VentaResumen } from '@/lib/types'

export function SalesTable({ ventas, compact = false }: { ventas: VentaResumen[]; compact?: boolean }) {
  if (ventas.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay ventas registradas.</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N.º</TableHead>
          <TableHead>Fecha</TableHead>
          {!compact && <TableHead>Cliente</TableHead>}
          {!compact && <TableHead>Pago</TableHead>}
          <TableHead className="text-right">Uds.</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ventas.map((v) => (
          <TableRow key={v.id}>
            <TableCell className="font-mono text-muted-foreground">{`#${String(v.id).padStart(5, '0')}`}</TableCell>
            <TableCell className="whitespace-nowrap">{formatDateTime(v.fecha)}</TableCell>
            {!compact && <TableCell>{v.cliente ?? <span className="text-muted-foreground">Mostrador</span>}</TableCell>}
            {!compact && <TableCell>{METODO_PAGO_LABEL[v.metodo_pago]}</TableCell>}
            <TableCell className="text-right font-mono">{Number(v.items)}</TableCell>
            <TableCell className="text-right font-mono font-medium">{formatMoney(v.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
