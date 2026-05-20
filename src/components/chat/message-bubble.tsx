'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Pencil, Check, X, Copy, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Message } from './chat'

interface Props {
  message: Message
  onEdit?: (newText: string) => void
}

function UserBubble({ message, onEdit }: Props) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)

  function confirmEdit() {
    const trimmed = editText.trim()
    if (trimmed) onEdit?.(trimmed)
    setEditing(false)
  }

  function cancelEdit() {
    setEditText(message.text)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex justify-end">
        <div className="w-full max-w-[75%]">
          <textarea
            className="w-full rounded-2xl border bg-background px-4 py-2.5 text-sm leading-relaxed resize-none outline-none focus:ring-1 focus:ring-ring"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmEdit() }
              if (e.key === 'Escape') cancelEdit()
            }}
            rows={Math.max(1, editText.split('\n').length)}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-1.5">
            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2" onClick={cancelEdit}>
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <Button size="sm" className="h-7 gap-1 px-2" onClick={confirmEdit}>
              <Check className="h-3.5 w-3.5" /> Send
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end items-start gap-1.5 group">
      {onEdit && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setEditing(true)}
          aria-label="Edit message"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      <div className="max-w-[75%] flex flex-col items-end gap-2">
        {message.imageData && (
          <img
            src={`data:${message.imageMimeType ?? 'image/jpeg'};base64,${message.imageData}`}
            alt="Attached image"
            className="max-h-60 max-w-full rounded-2xl object-contain"
          />
        )}
        {message.text.trim() && (
          <div className="rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground text-sm whitespace-pre-wrap break-words">
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}

function ModelBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(message.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex justify-start group">
      <div className="max-w-[85%] min-w-0 text-sm">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
            h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-muted-foreground/40 pl-3 my-3 text-muted-foreground italic">
                {children}
              </blockquote>
            ),
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:no-underline">
                {children}
              </a>
            ),
            pre: ({ children }) => (
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 my-3 font-mono leading-relaxed">
                {children}
              </pre>
            ),
            code: ({ children, className }) => {
              const isBlock = !!className || String(children).includes('\n')
              if (isBlock) {
                return <code className={cn('font-mono text-[0.8125rem]', className)}>{children}</code>
              }
              return <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.875em]">{children}</code>
            },
            table: ({ children }) => (
              <div className="overflow-x-auto my-3">
                <table className="w-full text-sm border-collapse">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border px-3 py-1.5 text-left font-semibold bg-muted">{children}</th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-3 py-1.5">{children}</td>
            ),
            hr: () => <hr className="my-4 border-border" />,
          }}
        >
          {message.text}
        </ReactMarkdown>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
          aria-label="Copy response"
        >
          {copied
            ? <CheckCheck className="h-3.5 w-3.5 text-green-500" />
            : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  )
}

export function MessageBubble({ message, onEdit }: Props) {
  if (message.role === 'user') return <UserBubble message={message} onEdit={onEdit} />
  return <ModelBubble message={message} />
}
