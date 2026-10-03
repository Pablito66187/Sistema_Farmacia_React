'use server'

import { revalidatePath } from 'next/cache'
import { withTransaction } from '@/lib/db'
import type { MetodoPago } from '@/lib/types'

const METODOS: MetodoPago[] = ['efectivo', 'tarjeta', 'transferencia']
const MAX_UNIDADES_POR_PRODUCTO = 500
const MAX_LINEAS = 50

type VentaInput = {
  cliente: string
  metodo_pago: MetodoPago
  items: { producto_id: number; cantidad: number }[]
}

export type RegistrarVentaResult = { ok: true; ventaId: number; total: number } | { ok: false; error: string }

class VentaError extends Error {}

export async function registrarVenta(input: VentaInput): Promise<RegistrarVentaResult> {
  const cliente = String(input.cliente ?? '').trim().slice(0, 120) || null
  const metodo = METODOS.includes(input.metodo_pago) ? input.metodo_pago : null
  if (!metodo) return { ok: false, error: 'Método de pago inválido.' }
  if (!Array.isArray(input.items) || input.items.length === 0) return { ok: false, error: 'El carrito está vacío.' }
  if (input.items.length > MAX_LINEAS) return { ok: false, error: 'Demasiados productos en una sola venta.' }

  const cantidades = new Map<number, number>()
  for (const item of input.items) {
    const id = Number(item.producto_id)
    const cantidad = Number(item.cantidad)
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(cantidad) || cantidad <= 0)
      return { ok: false, error: 'Cantidades inválidas en el carrito.' }
    cantidades.set(id, (cantidades.get(id) ?? 0) + cantidad)
  }
  for (const total of cantidades.values()) {
    if (total > MAX_UNIDADES_POR_PRODUCTO)
      return { ok: false, error: `Máximo ${MAX_UNIDADES_POR_PRODUCTO} unidades por producto.` }
  }

  try {
    const result = await withTransaction(async (conn) => {
      const ids = [...cantidades.keys()]
      const [rows] = await conn.query(
        'SELECT id, nombre, precio_venta, stock FROM productos WHERE activo = 1 AND id IN (?) FOR UPDATE',
        [ids],
      )
      const productos = rows as { id: number; nombre: string; precio_venta: number; stock: number }[]
      if (productos.length !== ids.length) throw new VentaError('Alguno de los productos ya no está disponible.')

      let total = 0
      const lineas = productos.map((p) => {
        const cantidad = cantidades.get(p.id)!
        if (cantidad > p.stock) throw new VentaError(`Stock insuficiente de "${p.nombre}" (disponible: ${p.stock}).`)
        const subtotal = Math.round(p.precio_venta * cantidad * 100) / 100
        total += subtotal
        return { id: p.id, cantidad, precio: p.precio_venta, subtotal }
      })
      total = Math.round(total * 100) / 100

      const [insert] = await conn.query('INSERT INTO ventas (cliente, metodo_pago, total) VALUES (?, ?, ?)', [
        cliente,
        metodo,
        total,
      ])
      const ventaId = (insert as { insertId: number }).insertId

      await conn.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ?',
        [lineas.map((l) => [ventaId, l.id, l.cantidad, l.precio, l.subtotal])],
      )
      for (const l of lineas) {
        await conn.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [l.cantidad, l.id])
      }
      return { ventaId, total }
    })

    revalidatePath('/', 'layout')
    return { ok: true, ...result }
  } catch (error) {
    if (error instanceof VentaError) return { ok: false, error: error.message }
    console.error('[farmacia] registrarVenta', error)
    return { ok: false, error: 'No se pudo registrar la venta.' }
  }
}
