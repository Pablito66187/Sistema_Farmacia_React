'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Search } from 'lucide-react'
import { NativeSelect } from '@/components/native-select'
import { Input } from '@/components/ui/input'
import type { Categoria } from '@/lib/types'

export function InventoryFilters({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.replace(`/inventario?${next.toString()}`, { scroll: false }))
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center" data-pending={pending || undefined}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="buscar" className="sr-only">
          Buscar producto
        </label>
        <Input
          id="buscar"
          type="search"
          placeholder="Buscar por nombre, código o principio activo"
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => update('q', e.target.value)}
          className="pl-8"
        />
      </div>
      <label htmlFor="categoria" className="sr-only">
        Categoría
      </label>
      <NativeSelect
        id="categoria"
        className="sm:w-52"
        defaultValue={params.get('categoria') ?? ''}
        onChange={(e) => update('categoria', e.target.value)}
      >
        <option value="">Todas las categorías</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </NativeSelect>
      <label htmlFor="estado" className="sr-only">
        Estado
      </label>
      <NativeSelect
        id="estado"
        className="sm:w-44"
        defaultValue={params.get('estado') ?? ''}
        onChange={(e) => update('estado', e.target.value)}
      >
        <option value="">Todos los estados</option>
        <option value="bajo">Stock bajo</option>
        <option value="vence">Por vencer (60 días)</option>
      </NativeSelect>
    </div>
  )
}
