'use client'

import { useRouter } from 'next/navigation'
import { Download, Printer } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function shift(today: string, days: number) {
  const d = new Date(`${today}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

export function ReportToolbar({ desde, hasta, today }: { desde: string; hasta: string; today: string }) {
  const router = useRouter()
  const presets = [
    { label: '30 días', desde: shift(today, 29) },
    { label: '90 días', desde: shift(today, 89) },
    { label: '6 meses', desde: shift(today, 182) },
    { label: 'Año', desde: `${today.slice(0, 4)}-01-01` },
  ]

  return (
    <div className="no-print flex flex-col gap-3 rounded-lg border bg-card p-4 lg:flex-row lg:items-end lg:justify-between">
      <form action="/reportes" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desde">Desde</Label>
          <Input id="desde" name="desde" type="date" defaultValue={desde} max={today} className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input id="hasta" name="hasta" type="date" defaultValue={hasta} max={today} className="w-40" />
        </div>
        <Button type="submit">Aplicar</Button>
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => {
            const active = p.desde === desde && hasta === today
            return (
              <Button
                key={p.label}
                type="button"
                size="sm"
                variant={active ? 'secondary' : 'ghost'}
                aria-pressed={active}
                onClick={() => router.push(`/reportes?desde=${p.desde}&hasta=${today}`)}
              >
                {p.label}
              </Button>
            )
          })}
        </div>
      </form>
      <div className="flex gap-2">
        <a
          href={`/api/reportes?tipo=ventas&desde=${desde}&hasta=${hasta}`}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          <Download />
          CSV de ventas
        </a>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer />
          Imprimir
        </Button>
      </div>
    </div>
  )
}
