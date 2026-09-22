/**
 * CreatorLabel — shared "Created by: [name]" label.
 *
 * Used in both TasksKanban and LeadsKanban cards. Renders nothing when
 * `creatorName` is null/undefined (e.g. legacy records with no creator FK).
 * Never displays generic placeholder values — the caller is responsible for
 * resolving the real name before passing it here.
 */

import { UserCircle } from 'lucide-react'

interface CreatorLabelProps {
  /** Resolved real name of the creator. Pass null/undefined to render nothing. */
  creatorName: string | null | undefined
  className?: string
}

export function CreatorLabel({ creatorName, className = '' }: CreatorLabelProps) {
  if (!creatorName) return null

  return (
    <div
      className={`flex items-center gap-1 text-xs text-muted-foreground mt-1 ${className}`}
    >
      <UserCircle className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">
        <span className="font-medium">Created by:</span> {creatorName}
      </span>
    </div>
  )
}
