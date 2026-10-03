'use server'

import { revalidatePath } from 'next/cache'
import { getPool, query, withTransaction } from '@/lib/db'
import { SCHEMA_STATEMENTS, SEED_CATEGORIAS, SEED_PRODUCTOS, SEED_PROVEEDORES } from '@/lib/schema'
import type { ActionResult } from '@/lib/types'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export async function inicializarBaseDatos(): Promise<ActionResult> {
  try {
    const pool = getPool()
    for (const statement of SCHEMA_STATEMENTS) {
      await pool.query(statement)
    }

    const existing = await query<{ n: number }>('SELECT COUNT(*) AS n FROM productos')
    if (Number(existing[0].n) > 0) {
      revalidatePath('/', 'layout')
      return { ok: true, message: 'Tablas verificadas. Ya existían datos.' }
    }

    await withTransaction(async (conn) => {
      await conn.query('INSERT INTO categorias (nombre) VALUES ?', [SEED_CATEGORIAS.map((n) => [n])])
      await conn.query('INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES ?', [SEED_PROVEEDORES])

      const [cats] = await conn.query('SELECT id FROM categorias ORDER BY id')
      const [provs] = await conn.query('SELECT id FROM proveedores ORDER BY id')
      const catIds = (cats as { id: number }[]).map((c) => c.id)
      const provIds = (provs as { id: number }[]).map((p) => p.id)

      const productRows = SEED_PRODUCTOS.map((p) => [
        p.codigo,
        p.nombre,
        p.principio,
        catIds[p.categoria - 1],
        provIds[p.proveedor - 1],
        p.compra,
        p.venta,
        p.stock,
        p.minimo,
        p.venceEnDias,
        p.receta ? 1 : 0,
      ])
      const productPlaceholders = productRows.map(() => '(?,?,?,?,?,?,?,?,?,CURDATE() + INTERVAL ? DAY,?)').join(',')
      await conn.query(
        `INSERT INTO productos (codigo, nombre, principio_activo, categoria_id, proveedor_id, precio_compra,
          precio_venta, stock, stock_minimo, fecha_vencimiento, requiere_receta) VALUES ${productPlaceholders}`,
        productRows.flat(),
      )

      const [prods] = await conn.query('SELECT id, precio_venta FROM productos ORDER BY id')
      const productos = prods as { id: number; precio_venta: number }[]

      const rand = seededRandom(42)
      const metodos = ['efectivo', 'efectivo', 'tarjeta', 'tarjeta', 'transferencia'] as const
      const clientes = [null, null, null, 'María López', 'Carlos Ruiz', 'Elena Vargas', 'Pedro Sánchez', 'Sofía Herrera']

      const ventas: { cliente: string | null; metodo: string; total: number; minutos: number }[] = []
      const detalles: [number, number, number, number, number][] = []

      const totalVentas = 520
      for (let i = 0; i < totalVentas; i++) {
        const ventaId = i + 1
        // Bias toward recent dates so trends rise over time.
        const diasAtras = Math.floor(Math.pow(rand(), 1.3) * 180)
        const minutos = diasAtras * 1440 + Math.floor(rand() * 600) + 15
        const numItems = 1 + Math.floor(rand() * 3)
        const usados = new Set<number>()
        let total = 0
        for (let j = 0; j < numItems; j++) {
          const idx = Math.floor(Math.pow(rand(), 1.6) * productos.length)
          if (usados.has(idx)) continue
          usados.add(idx)
          const prod = productos[idx]
          const cantidad = 1 + Math.floor(rand() * 3)
          const subtotal = Math.round(prod.precio_venta * cantidad * 100) / 100
          total += subtotal
          detalles.push([ventaId, prod.id, cantidad, prod.precio_venta, subtotal])
        }
        ventas.push({
          cliente: clientes[Math.floor(rand() * clientes.length)],
          metodo: metodos[Math.floor(rand() * metodos.length)],
          total: Math.round(total * 100) / 100,
          minutos,
        })
      }

      const ventaPlaceholders = ventas.map(() => '(?,?,?,?,NOW() - INTERVAL ? MINUTE)').join(',')
      await conn.query(
        `INSERT INTO ventas (id, cliente, metodo_pago, total, fecha) VALUES ${ventaPlaceholders}`,
        ventas.flatMap((v, i) => [i + 1, v.cliente, v.metodo, v.total, v.minutos]),
      )
      await conn.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ?',
        [detalles],
      )
    })

    revalidatePath('/', 'layout')
    return { ok: true, message: 'Base de datos creada con datos de ejemplo.' }
  } catch (error) {
    console.error('[farmacia] Error al inicializar la base de datos:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'No se pudo inicializar la base de datos' }
  }
}
