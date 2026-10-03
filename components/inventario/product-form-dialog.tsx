'use client'

import { useActionState, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { guardarProducto } from '@/app/actions/productos'
import { NativeSelect } from '@/components/native-select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionResult, Categoria, Producto, Proveedor } from '@/lib/types'

type Props = {
  producto?: Producto
  categorias: Categoria[]
  proveedores: Pick<Proveedor, 'id' | 'nombre'>[]
}

export function ProductFormDialog({ producto, categorias, proveedores }: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const result = await guardarProducto(prev, fd)
    if (result.ok) setOpen(false)
    return result
  }, null)

  const editing = Boolean(producto)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {editing ? (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Editar ${producto!.nombre}`} />}>
          <Pencil />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus />
          Nuevo producto
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          <DialogDescription>Los precios y el stock se validan en el servidor antes de guardar.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          {producto && <input type="hidden" name="id" value={producto.id} />}
          <Field label="Código" htmlFor="codigo">
            <Input id="codigo" name="codigo" required maxLength={40} defaultValue={producto?.codigo} className="font-mono" />
          </Field>
          <Field label="Nombre comercial" htmlFor="nombre">
            <Input id="nombre" name="nombre" required maxLength={160} defaultValue={producto?.nombre} />
          </Field>
          <Field label="Principio activo" htmlFor="principio_activo">
            <Input id="principio_activo" name="principio_activo" maxLength={160} defaultValue={producto?.principio_activo ?? ''} />
          </Field>
          <Field label="Categoría" htmlFor="categoria_id">
            <NativeSelect id="categoria_id" name="categoria_id" defaultValue={producto?.categoria_id ?? ''}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Proveedor" htmlFor="proveedor_id">
            <NativeSelect id="proveedor_id" name="proveedor_id" defaultValue={producto?.proveedor_id ?? ''}>
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Fecha de vencimiento" htmlFor="fecha_vencimiento">
            <Input
              id="fecha_vencimiento"
              name="fecha_vencimiento"
              type="date"
              defaultValue={producto?.fecha_vencimiento?.slice(0, 10) ?? ''}
            />
          </Field>
          <Field label="Precio de compra" htmlFor="precio_compra">
            <Input
              id="precio_compra"
              name="precio_compra"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={producto?.precio_compra ?? ''}
              className="font-mono"
            />
          </Field>
          <Field label="Precio de venta" htmlFor="precio_venta">
            <Input
              id="precio_venta"
              name="precio_venta"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={producto?.precio_venta ?? ''}
              className="font-mono"
            />
          </Field>
          <Field label="Stock actual" htmlFor="stock">
            <Input id="stock" name="stock" type="number" min={0} step={1} required defaultValue={producto?.stock ?? 0} className="font-mono" />
          </Field>
          <Field label="Stock mínimo" htmlFor="stock_minimo">
            <Input
              id="stock_minimo"
              name="stock_minimo"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={producto?.stock_minimo ?? 5}
              className="font-mono"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="requiere_receta"
              defaultChecked={Boolean(producto?.requiere_receta)}
              className="size-4 accent-primary"
            />
            Requiere receta médica
          </label>

          {state && !state.ok && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
              {state.error}
            </p>
          )}

          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
