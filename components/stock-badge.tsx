import { cn } from '@/lib/utils'

export function daysUntil(date: string | null, today: string) {
  if (!date) return null
  const diff = Date.parse(`${date.slice(0, 10)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)
  return Math.round(diff / 86_400_000)
}

export function StockBadge({ stock, minimo }: { stock: number; minimo: number }) {
  const low = stock <= minimo
  const out = stock === 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-xs font-medium',
        out ? 'bg-destructive/10 text-destructive' : low ? 'bg-warning/25 text-warning-foreground' : 'bg-accent text-accent-foreground',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 rounded-full', out ? 'bg-destructive' : low ? 'bg-warning' : 'bg-primary')}
      />
      {stock}
      <span className="sr-only">{out ? 'agotado' : low ? 'stock bajo' : 'en stock'}</span>
    </span>
  )
}

export function ExpiryLabel({ days }: { days: number | null }) {
  if (days === null) return <span className="text-muted-foreground">—</span>
  if (days < 0) return <span className="font-medium text-destructive">Vencido</span>
  if (days <= 60) return <span className="font-medium text-warning-foreground">{`${days} días`}</span>
  return null
}
