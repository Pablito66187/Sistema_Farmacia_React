'use server'

import { revalidatePath } from 'next/cache'
import { query } from '@/lib/db'
import type { ActionResult } from '@/lib/types'

export async function guardarProveedor(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const id = Number(form.get('id')) || null
  const nombre = String(form.get('nombre') ?? '').trim().slice(0, 120)
  const contacto = String(form.get('contacto') ?? '').trim().slice(0, 120) || null
  const telefono = String(form.get('telefono') ?? '').trim().slice(0, 40) || null
  const email = String(form.get('email') ?? '').trim().slice(0, 160) || null

  if (!nombre) return { ok: false, error: 'El nombre del proveedor es obligatorio.' }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'El email no es válido.' }

  try {
    if (id) {
      await query('UPDATE proveedores SET nombre=?, contacto=?, telefono=?, email=? WHERE id=?', [
        nombre,
        contacto,
        telefono,
        email,
        id,
      ])
    } else {
      await query('INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES (?,?,?,?)', [
        nombre,
        contacto,
        telefono,
        email,
      ])
    }
  } catch (error) {
    console.error('[farmacia] guardarProveedor', error)
    return { ok: false, error: 'No se pudo guardar el proveedor.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true, message: id ? 'Proveedor actualizado.' : 'Proveedor creado.' }
}

export async function eliminarProveedor(id: number): Promise<ActionResult> {
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Proveedor inválido.' }
  await query('DELETE FROM proveedores WHERE id = ?', [id])
  revalidatePath('/', 'layout')
  return { ok: true }
}
