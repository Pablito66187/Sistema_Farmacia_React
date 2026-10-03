export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia'

export type Categoria = { id: number; nombre: string }

export type Proveedor = {
  id: number
  nombre: string
  contacto: string | null
  telefono: string | null
  email: string | null
  productos: number
}

export type Producto = {
  id: number
  codigo: string
  nombre: string
  principio_activo: string | null
  categoria_id: number | null
  categoria: string | null
  proveedor_id: number | null
  proveedor: string | null
  precio_compra: number
  precio_venta: number
  stock: number
  stock_minimo: number
  fecha_vencimiento: string | null
  requiere_receta: number
}

export type VentaResumen = {
  id: number
  cliente: string | null
  metodo_pago: MetodoPago
  total: number
  fecha: string
  items: number
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }
