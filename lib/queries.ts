import { query } from '@/lib/db'
import type { Categoria, MetodoPago, Producto, Proveedor, VentaResumen } from '@/lib/types'

const PRODUCT_SELECT = `
  SELECT p.id, p.codigo, p.nombre, p.principio_activo, p.categoria_id, c.nombre AS categoria,
         p.proveedor_id, pr.nombre AS proveedor, p.precio_compra, p.precio_venta, p.stock,
         p.stock_minimo, p.fecha_vencimiento, p.requiere_receta
  FROM productos p
  LEFT JOIN categorias c ON c.id = p.categoria_id
  LEFT JOIN proveedores pr ON pr.id = p.proveedor_id`

export async function getToday() {
  const rows = await query<{ hoy: string }>(`SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy`)
  return rows[0].hoy
}

export async function getCategorias() {
  return query<Categoria>('SELECT id, nombre FROM categorias ORDER BY nombre')
}

export async function getProveedores() {
  return query<Proveedor>(
    `SELECT pr.id, pr.nombre, pr.contacto, pr.telefono, pr.email,
            COUNT(p.id) AS productos
     FROM proveedores pr
     LEFT JOIN productos p ON p.proveedor_id = pr.id AND p.activo = 1
     GROUP BY pr.id, pr.nombre, pr.contacto, pr.telefono, pr.email
     ORDER BY pr.nombre`,
  )
}

export async function getProductos(filters: { q?: string; categoria?: number; estado?: string } = {}) {
  const where: string[] = ['p.activo = 1']
  const params: unknown[] = []
  if (filters.q) {
    where.push('(p.nombre LIKE ? OR p.codigo LIKE ? OR p.principio_activo LIKE ?)')
    const like = `%${filters.q}%`
    params.push(like, like, like)
  }
  if (filters.categoria) {
    where.push('p.categoria_id = ?')
    params.push(filters.categoria)
  }
  if (filters.estado === 'bajo') where.push('p.stock <= p.stock_minimo')
  if (filters.estado === 'vence') where.push('p.fecha_vencimiento <= CURDATE() + INTERVAL 60 DAY')

  return query<Producto>(`${PRODUCT_SELECT} WHERE ${where.join(' AND ')} ORDER BY p.nombre`, params)
}

export async function getDashboard() {
  const [hoy, mes, inventario, alertas, porDia, top, ultimas] = await Promise.all([
    query<{ total: number | null; ventas: number }>(
      `SELECT SUM(total) AS total, COUNT(*) AS ventas FROM ventas WHERE fecha >= CURDATE()`,
    ),
    query<{ total: number | null; ventas: number }>(
      `SELECT SUM(total) AS total, COUNT(*) AS ventas FROM ventas
       WHERE fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
    ),
    query<{ productos: number; unidades: number | null; valor: number | null }>(
      `SELECT COUNT(*) AS productos, SUM(stock) AS unidades, SUM(stock * precio_compra) AS valor
       FROM productos WHERE activo = 1`,
    ),
    query<Producto>(
      `${PRODUCT_SELECT}
       WHERE p.activo = 1 AND (p.stock <= p.stock_minimo OR p.fecha_vencimiento <= CURDATE() + INTERVAL 60 DAY)
       ORDER BY (p.stock <= p.stock_minimo) DESC, p.fecha_vencimiento ASC
       LIMIT 8`,
    ),
    query<{ dia: string; total: number; ventas: number }>(
      `SELECT DATE_FORMAT(fecha, '%Y-%m-%d') AS dia, SUM(total) AS total, COUNT(*) AS ventas
       FROM ventas WHERE fecha >= CURDATE() - INTERVAL 29 DAY
       GROUP BY dia ORDER BY dia`,
    ),
    query<{ nombre: string; unidades: number; ingresos: number }>(
      `SELECT p.nombre, SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS ingresos
       FROM detalle_ventas d
       JOIN ventas v ON v.id = d.venta_id
       JOIN productos p ON p.id = d.producto_id
       WHERE v.fecha >= CURDATE() - INTERVAL 29 DAY
       GROUP BY p.id, p.nombre ORDER BY unidades DESC LIMIT 6`,
    ),
    getVentasRecientes(6),
  ])

  const today = await getToday()
  const byDay = new Map(porDia.map((r) => [r.dia, r]))
  const serie = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(`${today}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - (29 - i))
    const key = d.toISOString().slice(0, 10)
    const row = byDay.get(key)
    return { dia: key, total: Number(row?.total ?? 0), ventas: Number(row?.ventas ?? 0) }
  })

  const stockBajo = await query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM productos WHERE activo = 1 AND stock <= stock_minimo',
  )

  return {
    hoy: { total: Number(hoy[0].total ?? 0), ventas: Number(hoy[0].ventas) },
    mes: { total: Number(mes[0].total ?? 0), ventas: Number(mes[0].ventas) },
    inventario: {
      productos: Number(inventario[0].productos),
      unidades: Number(inventario[0].unidades ?? 0),
      valor: Number(inventario[0].valor ?? 0),
    },
    stockBajo: Number(stockBajo[0].n),
    alertas,
    serie,
    top: top.map((t) => ({ ...t, unidades: Number(t.unidades), ingresos: Number(t.ingresos) })),
    ultimas,
  }
}

export async function getVentasRecientes(limit = 25) {
  return query<VentaResumen>(
    `SELECT v.id, v.cliente, v.metodo_pago, v.total, v.fecha, COALESCE(SUM(d.cantidad), 0) AS items
     FROM ventas v LEFT JOIN detalle_ventas d ON d.venta_id = v.id
     GROUP BY v.id, v.cliente, v.metodo_pago, v.total, v.fecha
     ORDER BY v.fecha DESC, v.id DESC LIMIT ?`,
    [limit],
  )
}

export async function getVentaDetalle(ventaId: number) {
  return query<{ nombre: string; cantidad: number; precio_unitario: number; subtotal: number }>(
    `SELECT p.nombre, d.cantidad, d.precio_unitario, d.subtotal
     FROM detalle_ventas d JOIN productos p ON p.id = d.producto_id
     WHERE d.venta_id = ? ORDER BY d.id`,
    [ventaId],
  )
}

export async function getReporte(desde: string, hasta: string) {
  const range = [desde, hasta]
  const rangeSql = 'v.fecha >= ? AND v.fecha < (? + INTERVAL 1 DAY)'

  const [resumen, porMes, porCategoria, porMetodo, topProductos] = await Promise.all([
    query<{ ventas: number; total: number | null; unidades: number | null; costo: number | null }>(
      `SELECT COUNT(DISTINCT v.id) AS ventas, SUM(d.subtotal) AS total, SUM(d.cantidad) AS unidades,
              SUM(d.cantidad * p.precio_compra) AS costo
       FROM ventas v
       JOIN detalle_ventas d ON d.venta_id = v.id
       JOIN productos p ON p.id = d.producto_id
       WHERE ${rangeSql}`,
      range,
    ),
    query<{ mes: string; total: number; ventas: number }>(
      `SELECT DATE_FORMAT(v.fecha, '%Y-%m') AS mes, SUM(v.total) AS total, COUNT(*) AS ventas
       FROM ventas v WHERE ${rangeSql} GROUP BY mes ORDER BY mes`,
      range,
    ),
    query<{ categoria: string; total: number }>(
      `SELECT COALESCE(c.nombre, 'Sin categoría') AS categoria, SUM(d.subtotal) AS total
       FROM detalle_ventas d
       JOIN ventas v ON v.id = d.venta_id
       JOIN productos p ON p.id = d.producto_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE ${rangeSql}
       GROUP BY categoria ORDER BY total DESC`,
      range,
    ),
    query<{ metodo_pago: MetodoPago; total: number; ventas: number }>(
      `SELECT v.metodo_pago, SUM(v.total) AS total, COUNT(*) AS ventas
       FROM ventas v WHERE ${rangeSql} GROUP BY v.metodo_pago ORDER BY total DESC`,
      range,
    ),
    query<{ codigo: string; nombre: string; unidades: number; ingresos: number; ganancia: number }>(
      `SELECT p.codigo, p.nombre, SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS ingresos,
              SUM(d.subtotal - d.cantidad * p.precio_compra) AS ganancia
       FROM detalle_ventas d
       JOIN ventas v ON v.id = d.venta_id
       JOIN productos p ON p.id = d.producto_id
       WHERE ${rangeSql}
       GROUP BY p.id, p.codigo, p.nombre ORDER BY ingresos DESC LIMIT 10`,
      range,
    ),
  ])

  const total = Number(resumen[0].total ?? 0)
  const costo = Number(resumen[0].costo ?? 0)
  const ventas = Number(resumen[0].ventas)

  return {
    resumen: {
      ventas,
      total,
      unidades: Number(resumen[0].unidades ?? 0),
      ganancia: total - costo,
      ticketPromedio: ventas ? total / ventas : 0,
    },
    porMes: porMes.map((r) => ({ mes: r.mes, total: Number(r.total), ventas: Number(r.ventas) })),
    porCategoria: porCategoria.map((r) => ({ categoria: r.categoria, total: Number(r.total) })),
    porMetodo: porMetodo.map((r) => ({ metodo_pago: r.metodo_pago, total: Number(r.total), ventas: Number(r.ventas) })),
    topProductos: topProductos.map((r) => ({
      ...r,
      unidades: Number(r.unidades),
      ingresos: Number(r.ingresos),
      ganancia: Number(r.ganancia),
    })),
  }
}

export function isValidDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)))
}
