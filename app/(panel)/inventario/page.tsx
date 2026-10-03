import { Download } from 'lucide-react'
import { eliminarProducto } from '@/app/actions/productos'
import { DeleteButton } from '@/components/delete-button'
import { InventoryFilters } from '@/components/inventario/inventory-filters'
import { ProductFormDialog } from '@/components/inventario/product-form-dialog'
import { PageHeader } from '@/components/page-header'
import { daysUntil, ExpiryLabel, StockBadge } from '@/components/stock-badge'
import { buttonVariants } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatMoney } from '@/lib/format'
import { getCategorias, getProductos, getProveedores, getToday } from '@/lib/queries'

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; estado?: string }>
}) {
  const sp = await searchParams
  const [productos, categorias, proveedores, today] = await Promise.all([
    getProductos({
      q: sp.q?.slice(0, 80),
      categoria: Number(sp.categoria) || undefined,
      estado: sp.estado,
    }),
    getCategorias(),
    getProveedores(),
    getToday(),
  ])

  return (
    <>
      <PageHeader title="Inventario" description="Medicamentos e insumos, con control de stock y vencimientos.">
        <a href="/api/reportes?tipo=inventario" className={buttonVariants({ variant: 'outline' })}>
          <Download />
          Exportar CSV
        </a>
        <ProductFormDialog categorias={categorias} proveedores={proveedores} />
      </PageHeader>

      <InventoryFilters categorias={categorias} />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="hidden md:table-cell">Categoría</TableHead>
              <TableHead className="hidden lg:table-cell">Proveedor</TableHead>
              <TableHead className="text-right">P. venta</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="hidden sm:table-cell">Vence</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            )}
            {productos.map((p) => {
              const days = daysUntil(p.fecha_vencimiento, today)
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2 font-medium">
                        {p.nombre}
                        {Boolean(p.requiere_receta) && (
                          <span className="rounded border border-primary/30 px-1 font-mono text-[10px] font-semibold text-primary">
                            Rx
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.codigo}
                        {p.principio_activo && p.principio_activo !== '-' ? ` · ${p.principio_activo}` : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{p.categoria ?? '—'}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{p.proveedor ?? '—'}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(p.precio_venta)}</TableCell>
                  <TableCell className="text-right">
                    <StockBadge stock={p.stock} minimo={p.stock_minimo} />
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap sm:table-cell">
                    <div className="flex flex-col text-sm">
                      <span>{formatDate(p.fecha_vencimiento)}</span>
                      <span className="text-xs">
                        <ExpiryLabel days={days} />
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <ProductFormDialog producto={p} categorias={categorias} proveedores={proveedores} />
                      <DeleteButton
                        label={`Eliminar ${p.nombre}`}
                        confirmText={`¿Dar de baja "${p.nombre}"? El historial de ventas se conservará.`}
                        onDelete={eliminarProducto.bind(null, p.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">{`${productos.length} productos`}</p>
    </>
  )
}
