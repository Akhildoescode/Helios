'use client'

import { MessageSquare, PenSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/lib/db'

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

export function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }: SidebarProps) {
  return (
    <div className="flex flex-col w-60 border-r bg-muted/20 shrink-0">
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <span className="font-semibold tracking-tight text-sm">Helios</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onNew}
          aria-label="New chat"
        >
          <PenSquare className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="py-1.5 px-1.5 space-y-0.5">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-2">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={conv.id === activeId}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface ItemProps {
  conv: Conversation
  active: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

function ConversationItem({ conv, active, onSelect, onDelete }: ItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
      onClick={() => onSelect(conv.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(conv.id)}
    >
      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate text-xs leading-snug">{conv.title}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity -mr-0.5"
        onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
        aria-label="Delete conversation"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}
