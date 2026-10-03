'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChartColumn, LayoutDashboard, Pill, ShoppingCart, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/ventas', label: 'Punto de venta', icon: ShoppingCart },
  { href: '/inventario', label: 'Inventario', icon: Pill },
  { href: '/proveedores', label: 'Proveedores', icon: Truck },
  { href: '/reportes', label: 'Reportes', icon: ChartColumn },
]

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary', className)}
    >
      <span className="absolute h-4 w-1.5 rounded-sm bg-sidebar-primary-foreground" />
      <span className="absolute h-1.5 w-4 rounded-sm bg-sidebar-primary-foreground" />
    </span>
  )
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="no-print sticky top-0 z-30 flex shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:h-dvh lg:w-64">
      <div className="flex items-center gap-3 px-4 py-4 lg:px-5 lg:py-6">
        <BrandMark />
        <div className="flex flex-col leading-tight">
          <span className="font-semibold tracking-tight text-sidebar-accent-foreground">Botica</span>
          <span className="font-mono text-xs text-sidebar-foreground/70">Gestor de farmacia</span>
        </div>
      </div>

      <nav aria-label="Principal" className="overflow-x-auto px-2 pb-3 lg:flex-1 lg:px-3 lg:pb-0">
        <ul className="flex gap-1 lg:flex-col">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className={cn('size-4', active && 'text-sidebar-primary')} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="hidden border-t border-sidebar-border px-5 py-4 lg:block">
        <p className="font-mono text-xs text-sidebar-foreground/60">MySQL · conectado</p>
      </div>
    </aside>
  )
}
