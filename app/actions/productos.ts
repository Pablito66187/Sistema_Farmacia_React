'use server'

import { revalidatePath } from 'next/cache'
import { query } from '@/lib/db'
import type { ActionResult } from '@/lib/types'

function text(form: FormData, key: string, max: number) {
  const value = String(form.get(key) ?? '').trim()
  return value.slice(0, max)
}

function num(form: FormData, key: string) {
  const raw = String(form.get(key) ?? '').replace(',', '.')
  const value = Number(raw)
  return Number.isFinite(value) ? value : NaN
}

function optionalId(form: FormData, key: string) {
  const value = Number(form.get(key))
  return Number.isInteger(value) && value > 0 ? value : null
}

export async function guardarProducto(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const id = optionalId(form, 'id')
  const codigo = text(form, 'codigo', 40)
  const nombre = text(form, 'nombre', 160)
  const principio = text(form, 'principio_activo', 160) || null
  const categoriaId = optionalId(form, 'categoria_id')
  const proveedorId = optionalId(form, 'proveedor_id')
  const precioCompra = num(form, 'precio_compra')
  const precioVenta = num(form, 'precio_venta')
  const stock = num(form, 'stock')
  const stockMinimo = num(form, 'stock_minimo')
  const vencimiento = text(form, 'fecha_vencimiento', 10) || null
  const receta = form.get('requiere_receta') === 'on' ? 1 : 0

  if (!codigo || !nombre) return { ok: false, error: 'El código y el nombre son obligatorios.' }
  if (!(precioCompra >= 0) || !(precioVenta >= 0) || precioCompra > 1_000_000 || precioVenta > 1_000_000)
    return { ok: false, error: 'Los precios deben ser números válidos.' }
  if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(stockMinimo) || stockMinimo < 0)
    return { ok: false, error: 'El stock debe ser un número entero mayor o igual a 0.' }
  if (vencimiento && !/^\d{4}-\d{2}-\d{2}$/.test(vencimiento))
    return { ok: false, error: 'La fecha de vencimiento no es válida.' }

  const values = [codigo, nombre, principio, categoriaId, proveedorId, precioCompra, precioVenta, stock, stockMinimo, vencimiento, receta]

  try {
    if (id) {
      await query(
        `UPDATE productos SET codigo=?, nombre=?, principio_activo=?, categoria_id=?, proveedor_id=?,
          precio_compra=?, precio_venta=?, stock=?, stock_minimo=?, fecha_vencimiento=?, requiere_receta=?
         WHERE id=?`,
        [...values, id],
      )
    } else {
      await query(
        `INSERT INTO productos (codigo, nombre, principio_activo, categoria_id, proveedor_id, precio_compra,
          precio_venta, stock, stock_minimo, fecha_vencimiento, requiere_receta)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        values,
      )
    }
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY')
      return { ok: false, error: `Ya existe un producto con el código ${codigo}.` }
    console.error('[farmacia] guardarProducto', error)
    return { ok: false, error: 'No se pudo guardar el producto.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true, message: id ? 'Producto actualizado.' : 'Producto creado.' }
}

export async function eliminarProducto(id: number): Promise<ActionResult> {
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Producto inválido.' }
  // Soft delete keeps sales history intact.
  await query(`UPDATE productos SET activo = 0, codigo = CONCAT(codigo, '-baja-', id) WHERE id = ? AND activo = 1`, [id])
  revalidatePath('/', 'layout')
  return { ok: true }
}
