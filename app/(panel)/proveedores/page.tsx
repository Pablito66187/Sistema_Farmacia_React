import { eliminarProveedor } from '@/app/actions/proveedores'
import { DeleteButton } from '@/components/delete-button'
import { PageHeader } from '@/components/page-header'
import { SupplierFormDialog } from '@/components/proveedores/supplier-form-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getProveedores } from '@/lib/queries'

export default async function ProveedoresPage() {
  const proveedores = await getProveedores()

  return (
    <>
      <PageHeader title="Proveedores" description="Laboratorios y distribuidoras que abastecen la farmacia.">
        <SupplierFormDialog />
      </PageHeader>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead className="hidden md:table-cell">Contacto</TableHead>
              <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="text-right">Productos</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proveedores.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No hay proveedores registrados.
                </TableCell>
              </TableRow>
            )}
            {proveedores.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nombre}</TableCell>
                <TableCell className="hidden md:table-cell">{p.contacto ?? '—'}</TableCell>
                <TableCell className="hidden font-mono text-sm sm:table-cell">{p.telefono ?? '—'}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {p.email ? (
                    <a href={`mailto:${p.email}`} className="text-primary hover:underline">
                      {p.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">{Number(p.productos)}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <SupplierFormDialog proveedor={p} />
                    <DeleteButton
                      label={`Eliminar ${p.nombre}`}
                      confirmText={`¿Eliminar "${p.nombre}"? Sus productos quedarán sin proveedor asignado.`}
                      onDelete={eliminarProveedor.bind(null, p.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
