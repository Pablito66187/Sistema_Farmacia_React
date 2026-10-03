import { connection } from 'next/server'
import { AppSidebar } from '@/components/app-sidebar'
import { SetupScreen } from '@/components/setup-screen'
import { getDbStatus } from '@/lib/db'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await connection()
  const status = await getDbStatus()

  if (status.state !== 'ok') {
    return <SetupScreen status={status} />
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <AppSidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  )
}
