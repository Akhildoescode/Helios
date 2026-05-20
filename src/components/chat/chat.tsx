'use client'

import { useEffect, useRef, useState } from 'react'
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
}

interface ChatProps {
  conversationId: string | null
  onConversationCreated: (id: string) => void
}

export function Chat({ conversationId, onConversationCreated }: ChatProps) {
  const { apiKey, model, systemPrompt, temperature, maxTokens } = useSettingsStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const convIdRef = useRef<string | null>(conversationId)

  // Load messages for an existing conversation on mount
  useEffect(() => {
    if (!conversationId) return
    db.messages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('createdAt')
      .then((rows) =>
        setMessages(rows.map(({ id, role, text }) => ({ id, role, text }))),
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
        title: firstUser.text.slice(0, 80).trim(),
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
        createdAt: Date.now() + i,
      })),
    )
  }

  async function sendMessage(userText: string, history: Message[]) {
    if (!apiKey) {
      toast.error('No API key set — open Settings to add your Gemini API key.')
      return
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: userText }
    const modelMsg: Message = { id: crypto.randomUUID(), role: 'model', text: '' }
    setMessages([...history, userMsg, modelMsg])
    setIsLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    let accumulated = ''

    try {
      const chatHistory = history.map(({ role, text }) => ({ role, text }))
      for await (const chunk of generateReplyStream(
        { apiKey, model, systemPrompt, temperature, maxTokens, history: chatHistory, userText },
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

  function handleSend(text: string) {
    sendMessage(text, messages)
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  function handleRegenerate() {
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf('user')
    if (lastUserIdx === -1) return
    sendMessage(messages[lastUserIdx].text, messages.slice(0, lastUserIdx))
  }

  function handleEditMessage(id: string, newText: string) {
    const idx = messages.findIndex((m) => m.id === id)
    if (idx === -1) return
    sendMessage(newText, messages.slice(0, idx))
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
}
