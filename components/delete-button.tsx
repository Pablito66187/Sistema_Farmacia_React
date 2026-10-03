'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActionResult } from '@/lib/types'

export function DeleteButton({
  label,
  confirmText,
  onDelete,
}: {
  label: string
  confirmText: string
  onDelete: () => Promise<ActionResult>
}) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      disabled={pending}
      className="text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (!window.confirm(confirmText)) return
        startTransition(async () => {
          const result = await onDelete()
          if (!result.ok) window.alert(result.error)
        })
      }}
    >
      <Trash2 />
    </Button>
  )
}
