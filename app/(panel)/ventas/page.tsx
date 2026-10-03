import { PageHeader, Panel } from '@/components/page-header'
import { SalesTable } from '@/components/sales-table'
import { PointOfSale } from '@/components/ventas/point-of-sale'
import { getProductos, getVentasRecientes } from '@/lib/queries'

export default async function VentasPage() {
  const [productos, ventas] = await Promise.all([getProductos(), getVentasRecientes(20)])
  const disponibles = productos.filter((p) => p.stock > 0)

  return (
    <>
      <PageHeader
        title="Punto de venta"
        description="Registra ventas; el stock se descuenta automáticamente y los precios se validan en el servidor."
      />
      <PointOfSale productos={disponibles} />
      <Panel title="Historial de ventas" description="Últimas 20 transacciones">
        <SalesTable ventas={ventas} />
      </Panel>
    </>
  )
}
