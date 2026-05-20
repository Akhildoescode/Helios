'use client'

import { useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessageBubble } from './message-bubble'
import type { Message } from './chat'

function ThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 px-1 py-2">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

interface Props {
  messages: Message[]
  isLoading: boolean
  onRegenerate: () => void
  onEditMessage: (id: string, newText: string) => void
}

export function MessageList({ messages, isLoading, onRegenerate, onEditMessage }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const lastMsg = messages[messages.length - 1]
  // Show thinking dots until first chunk arrives
  const showThinking = isLoading && lastMsg?.role === 'model' && lastMsg.text === ''
  // Show regenerate when idle and conversation ends with a model reply
  const showRegenerate = !isLoading && lastMsg?.role === 'model'
  // Hide the empty placeholder model bubble while thinking
  const visibleMessages = showThinking ? messages.slice(0, -1) : messages

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm select-none">
        Start a conversation
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-3xl w-full space-y-6">
        {visibleMessages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onEdit={m.role === 'user' ? (newText) => onEditMessage(m.id, newText) : undefined}
          />
        ))}
        {showThinking && <ThinkingIndicator />}
        {showRegenerate && (
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1.5 h-7 px-2"
              onClick={onRegenerate}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
