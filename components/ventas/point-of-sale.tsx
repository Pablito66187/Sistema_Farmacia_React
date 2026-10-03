'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Minus, PackageSearch, Plus, Search, X } from 'lucide-react'
import { registrarVenta } from '@/app/actions/ventas'
import { NativeSelect } from '@/components/native-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatMoney } from '@/lib/format'
import type { MetodoPago, Producto } from '@/lib/types'
import { cn } from '@/lib/utils'

type CartLine = { producto: Producto; cantidad: number }

export function PointOfSale({ productos }: { productos: Producto[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [cliente, setCliente] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [error, setError] = useState<string | null>(null)
  const [ultimaVenta, setUltimaVenta] = useState<{ id: number; total: number } | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return productos
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.principio_activo ?? '').toLowerCase().includes(q),
    )
  }, [productos, search])

  const total = cart.reduce((acc, l) => acc + l.producto.precio_venta * l.cantidad, 0)
  const unidades = cart.reduce((acc, l) => acc + l.cantidad, 0)
  const requiereReceta = cart.some((l) => l.producto.requiere_receta)

  function add(producto: Producto) {
    setUltimaVenta(null)
    setError(null)
    setCart((prev) => {
      const existing = prev.find((l) => l.producto.id === producto.id)
      if (existing) {
        return prev.map((l) =>
          l.producto.id === producto.id ? { ...l, cantidad: Math.min(l.cantidad + 1, producto.stock) } : l,
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  function setQty(id: number, cantidad: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.producto.id === id ? { ...l, cantidad: Math.max(0, Math.min(cantidad, l.producto.stock)) } : l))
        .filter((l) => l.cantidad > 0),
    )
  }

  function checkout() {
    setError(null)
    startTransition(async () => {
      const result = await registrarVenta({
        cliente,
        metodo_pago: metodo,
        items: cart.map((l) => ({ producto_id: l.producto.id, cantidad: l.cantidad })),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setUltimaVenta({ id: result.ventaId, total: result.total })
      setCart([])
      setCliente('')
      router.refresh()
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <section aria-label="Catálogo" className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4 lg:col-span-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="pos-search" className="sr-only">
            Buscar producto
          </label>
          <Input
            id="pos-search"
            type="search"
            autoFocus
            placeholder="Escanea o busca por nombre, código o principio activo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-8"
          />
        </div>
        <ul className="grid max-h-[28rem] gap-2 overflow-y-auto sm:grid-cols-2">
          {filtered.length === 0 && (
            <li className="col-span-full flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
              <PackageSearch className="size-6" />
              Sin resultados con stock disponible.
            </li>
          )}
          {filtered.map((p) => {
            const inCart = cart.find((l) => l.producto.id === p.id)?.cantidad ?? 0
            const agotado = inCart >= p.stock
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => add(p)}
                  disabled={agotado}
                  className={cn(
                    'flex w-full flex-col gap-1 rounded-md border bg-background p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50',
                    inCart > 0 && 'border-primary/60',
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm leading-snug font-medium">{p.nombre}</span>
                    <span className="font-mono text-sm font-semibold">{formatMoney(p.precio_venta)}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground">
                    <span>
                      {p.codigo}
                      {p.requiere_receta ? ' · Rx' : ''}
                    </span>
                    <span>{`stock ${p.stock - inCart}`}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-label="Ticket de venta" className="flex flex-col gap-4 rounded-lg border bg-card p-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Ticket</h2>
          {cart.length > 0 && (
            <button type="button" onClick={() => setCart([])} className="text-sm text-muted-foreground hover:text-destructive">
              Vaciar
            </button>
          )}
        </div>

        {ultimaVenta && (
          <div role="status" className="flex items-center gap-3 rounded-md bg-accent px-3 py-2.5 text-sm text-accent-foreground">
            <Check className="size-4 shrink-0" />
            <span>
              {`Venta #${String(ultimaVenta.id).padStart(5, '0')} registrada por `}
              <strong className="font-mono">{formatMoney(ultimaVenta.total)}</strong>
            </span>
          </div>
        )}

        {cart.length === 0 ? (
          <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            Selecciona productos del catálogo para agregarlos.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {cart.map((l) => (
              <li key={l.producto.id} className="flex items-center gap-3 py-2.5">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{l.producto.nombre}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {`${formatMoney(l.producto.precio_venta)} c/u`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    aria-label={`Quitar una unidad de ${l.producto.nombre}`}
                    onClick={() => setQty(l.producto.id, l.cantidad - 1)}
                  >
                    <Minus />
                  </Button>
                  <span className="w-8 text-center font-mono text-sm" aria-live="polite">
                    {l.cantidad}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    aria-label={`Agregar una unidad de ${l.producto.nombre}`}
                    disabled={l.cantidad >= l.producto.stock}
                    onClick={() => setQty(l.producto.id, l.cantidad + 1)}
                  >
                    <Plus />
                  </Button>
                </div>
                <span className="w-20 text-right font-mono text-sm font-medium">
                  {formatMoney(l.producto.precio_venta * l.cantidad)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Eliminar ${l.producto.nombre} del ticket`}
                  onClick={() => setQty(l.producto.id, 0)}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {requiereReceta && (
          <p className="rounded-md bg-warning/20 px-3 py-2 text-sm text-warning-foreground">
            El ticket incluye medicamentos que requieren receta médica. Verifica la prescripción.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cliente">Cliente</Label>
            <Input
              id="cliente"
              placeholder="Mostrador"
              maxLength={120}
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="metodo">Método de pago</Label>
            <NativeSelect id="metodo" value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </NativeSelect>
          </div>
        </div>

        <div className="flex items-end justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">{`${unidades} unidades`}</span>
          <div className="flex flex-col items-end">
            <span className="text-xs tracking-wide text-muted-foreground uppercase">Total</span>
            <span className="font-mono text-3xl font-semibold tracking-tight">{formatMoney(total)}</span>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button size="lg" className="h-11 text-base" disabled={cart.length === 0 || pending} onClick={checkout}>
          {pending ? 'Registrando…' : 'Cobrar venta'}
        </Button>
      </section>
    </div>
  )
}
