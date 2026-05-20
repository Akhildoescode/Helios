'use client'

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { toast } from 'sonner'
import { useSettingsStore } from '@/store/settings'
import { generateReplyStream } from '@/lib/gemini'
import { db } from '@/lib/db'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'

export interface Message {
  id: string
  role: 'user' | 'model'
  text: string
  imageData?: string
  imageMimeType?: string
}

export interface ChatHandle {
  exportMarkdown: () => void
}

interface ChatProps {
  conversationId: string | null
  onConversationCreated: (id: string) => void
  title?: string
}

export const Chat = forwardRef<ChatHandle, ChatProps>(function Chat(
  { conversationId, onConversationCreated, title },
  ref,
) {
  const { apiKey, model, systemPrompt, temperature, maxTokens } = useSettingsStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const convIdRef = useRef<string | null>(conversationId)

  useImperativeHandle(ref, () => ({
    exportMarkdown() {
      if (messages.length === 0) {
        toast.error('Nothing to export yet.')
        return
      }
      const convTitle = title ?? 'Conversation'
      const lines: string[] = [`# ${convTitle}`, '']
      for (const msg of messages) {
        if (msg.role === 'user') {
          lines.push('**You**', '')
          if (msg.imageData) lines.push('*[Image attached]*', '')
          lines.push(msg.text, '', '---', '')
        } else {
          lines.push('**Helios**', '', msg.text, '', '---', '')
        }
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${convTitle.slice(0, 40).replace(/[^a-z0-9]/gi, '-')}.md`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Exported as Markdown')
    },
  }), [messages, title])

  // Load messages for an existing conversation on mount
  useEffect(() => {
    if (!conversationId) return
    db.messages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('createdAt')
      .then((rows) =>
        setMessages(
          rows.map(({ id, role, text, imageData, imageMimeType }) => ({
            id,
            role,
            text,
            imageData,
            imageMimeType,
          })),
        ),
      )
  }, []) // intentionally empty — key prop handles remount on conversation switch

  async function persistExchange(finalMessages: Message[]) {
    let id = convIdRef.current
    const firstUser = finalMessages.find((m) => m.role === 'user')
    if (!firstUser) return

    if (!id) {
      id = crypto.randomUUID()
      convIdRef.current = id
      await db.conversations.add({
        id,
        title: firstUser.text.slice(0, 80).trim() || 'Image',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      onConversationCreated(id)
    } else {
      await db.conversations.update(id, { updatedAt: Date.now() })
    }

    // Overwrite messages so regenerate/edit stays in sync
    await db.messages.where('conversationId').equals(id).delete()
    await db.messages.bulkAdd(
      finalMessages.map((m, i) => ({
        id: m.id,
        conversationId: id!,
        role: m.role,
        text: m.text,
        ...(m.imageData && { imageData: m.imageData, imageMimeType: m.imageMimeType }),
        createdAt: Date.now() + i,
      })),
    )
  }

  async function sendMessage(
    userText: string,
    history: Message[],
    imageData?: string,
    imageMimeType?: string,
  ) {
    if (!apiKey) {
      toast.error('No API key set — open Settings to add your Gemini API key.')
      return
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: userText,
      imageData,
      imageMimeType,
    }
    const modelMsg: Message = { id: crypto.randomUUID(), role: 'model', text: '' }
    setMessages([...history, userMsg, modelMsg])
    setIsLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    let accumulated = ''

    try {
      const chatHistory = history.map(({ role, text }) => ({ role, text }))
      for await (const chunk of generateReplyStream(
        {
          apiKey,
          model,
          systemPrompt,
          temperature,
          maxTokens,
          history: chatHistory,
          userText,
          imageData,
          imageMimeType,
        },
        controller.signal,
      )) {
        accumulated += chunk
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          return [...prev.slice(0, -1), { ...last, text: last.text + chunk }]
        })
      }

      if (!controller.signal.aborted) {
        const finalMessages = [...history, userMsg, { ...modelMsg, text: accumulated }]
        await persistExchange(finalMessages)
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.')
        setMessages(history)
      }
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  function handleSend(text: string, imageData?: string, imageMimeType?: string) {
    sendMessage(text, messages, imageData, imageMimeType)
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  function handleRegenerate() {
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf('user')
    if (lastUserIdx === -1) return
    const lastUser = messages[lastUserIdx]
    sendMessage(lastUser.text, messages.slice(0, lastUserIdx), lastUser.imageData, lastUser.imageMimeType)
  }

  function handleEditMessage(id: string, newText: string) {
    const idx = messages.findIndex((m) => m.id === id)
    if (idx === -1) return
    const original = messages[idx]
    sendMessage(newText, messages.slice(0, idx), original.imageData, original.imageMimeType)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onRegenerate={handleRegenerate}
        onEditMessage={handleEditMessage}
      />
      <ChatInput onSend={handleSend} onStop={handleStop} isLoading={isLoading} />
    </div>
  )
})
