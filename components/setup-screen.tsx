'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from 'lucide-react'
import { inicializarBaseDatos } from '@/app/actions/setup'
import { BrandMark } from '@/components/app-sidebar'
import { Button } from '@/components/ui/button'
import type { DbStatus } from '@/lib/db'

export function SetupScreen({ status }: { status: Exclude<DbStatus, { state: 'ok' }> }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleInit() {
    setError(null)
    startTransition(async () => {
      const result = await inicializarBaseDatos()
      if (result.ok) router.refresh()
      else setError(result.error)
    })
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-sidebar px-4 py-10">
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-xl bg-card p-6 text-card-foreground shadow-xl md:p-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div className="flex flex-col leading-tight">
            <span className="font-semibold">Botica</span>
            <span className="font-mono text-xs text-muted-foreground">Configuración inicial</span>
          </div>
        </div>

        {status.state === 'missing-config' && (
          <div className="flex flex-col gap-3">
            <h1 className="text-xl font-semibold text-balance">Conecta tu base de datos MySQL</h1>
            <p className="leading-relaxed text-muted-foreground">
              Agrega la variable de entorno <code className="font-mono text-foreground">DATABASE_URL</code> en la sección{' '}
              <strong className="text-foreground">Vars</strong> de la configuración del proyecto con el siguiente formato:
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-sm">
              mysql://usuario:contraseña@host:3306/farmacia
            </pre>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Si tu proveedor requiere SSL (PlanetScale, Aiven, AWS RDS, etc.), agrega también{' '}
              <code className="font-mono text-foreground">DATABASE_SSL=true</code>.
            </p>
          </div>
        )}

        {status.state === 'missing-tables' && (
          <div className="flex flex-col gap-3">
            <h1 className="text-xl font-semibold text-balance">Conexión exitosa. Faltan las tablas.</h1>
            <p className="leading-relaxed text-muted-foreground">
              Se crearán las tablas <span className="font-mono text-foreground">categorias</span>,{' '}
              <span className="font-mono text-foreground">proveedores</span>,{' '}
              <span className="font-mono text-foreground">productos</span>,{' '}
              <span className="font-mono text-foreground">ventas</span> y{' '}
              <span className="font-mono text-foreground">detalle_ventas</span>, junto con 20 medicamentos y 6 meses de
              ventas de ejemplo para los reportes.
            </p>
            <Button onClick={handleInit} disabled={pending} size="lg" className="mt-2">
              <Database />
              {pending ? 'Creando base de datos…' : 'Crear tablas y datos de ejemplo'}
            </Button>
          </div>
        )}

        {status.state === 'error' && (
          <div className="flex flex-col gap-3">
            <h1 className="text-xl font-semibold text-balance">No se pudo conectar a MySQL</h1>
            <p className="leading-relaxed text-muted-foreground">
              Revisa que <code className="font-mono text-foreground">DATABASE_URL</code> sea correcta y que el servidor
              acepte conexiones externas.
            </p>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted px-3 py-2 font-mono text-sm text-destructive">
              {status.message}
            </pre>
            <Button variant="outline" onClick={() => router.refresh()}>
              Reintentar
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
