'use client'

import { useActionState, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { guardarProveedor } from '@/app/actions/proveedores'
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
import type { ActionResult, Proveedor } from '@/lib/types'

export function SupplierFormDialog({ proveedor }: { proveedor?: Proveedor }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const result = await guardarProveedor(prev, fd)
    if (result.ok) setOpen(false)
    return result
  }, null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {proveedor ? (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Editar ${proveedor.nombre}`} />}>
          <Pencil />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus />
          Nuevo proveedor
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          <DialogDescription>Datos de contacto del laboratorio o distribuidora.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {proveedor && <input type="hidden" name="id" value={proveedor.id} />}
          {[
            { name: 'nombre', label: 'Razón social', required: true, value: proveedor?.nombre },
            { name: 'contacto', label: 'Persona de contacto', value: proveedor?.contacto },
            { name: 'telefono', label: 'Teléfono', type: 'tel', value: proveedor?.telefono },
            { name: 'email', label: 'Email', type: 'email', value: proveedor?.email },
          ].map((f) => (
            <div key={f.name} className="flex flex-col gap-1.5">
              <Label htmlFor={`prov-${f.name}`}>{f.label}</Label>
              <Input
                id={`prov-${f.name}`}
                name={f.name}
                type={f.type ?? 'text'}
                required={f.required}
                defaultValue={f.value ?? ''}
              />
            </div>
          ))}
          {state && !state.ok && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar proveedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
