import { type NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { isValidDate } from '@/lib/queries'

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    // Prefix formula-like values to prevent CSV injection in spreadsheet apps.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
    return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tipo = searchParams.get('tipo')

  let rows: Record<string, unknown>[] = []
  let filename = 'reporte.csv'

  if (tipo === 'inventario') {
    rows = await query(
      `SELECT p.codigo, p.nombre, p.principio_activo, c.nombre AS categoria, pr.nombre AS proveedor,
              p.precio_compra, p.precio_venta, p.stock, p.stock_minimo, p.fecha_vencimiento,
              IF(p.requiere_receta, 'si', 'no') AS requiere_receta
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
       WHERE p.activo = 1 ORDER BY p.nombre`,
    )
    filename = 'inventario.csv'
  } else if (tipo === 'ventas') {
    const desde = searchParams.get('desde') ?? ''
    const hasta = searchParams.get('hasta') ?? ''
    if (!isValidDate(desde) || !isValidDate(hasta)) {
      return new Response('Parámetros de fecha inválidos', { status: 400 })
    }
    rows = await query(
      `SELECT v.id AS venta, v.fecha, COALESCE(v.cliente, 'Mostrador') AS cliente, v.metodo_pago,
              p.codigo, p.nombre AS producto, d.cantidad, d.precio_unitario, d.subtotal
       FROM ventas v
       JOIN detalle_ventas d ON d.venta_id = v.id
       JOIN productos p ON p.id = d.producto_id
       WHERE v.fecha >= ? AND v.fecha < (? + INTERVAL 1 DAY)
       ORDER BY v.fecha, v.id`,
      [desde, hasta],
    )
    filename = `ventas_${desde}_${hasta}.csv`
  } else {
    return new Response('Tipo de reporte inválido', { status: 400 })
  }

  return new Response(`\uFEFF${toCsv(rows)}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
