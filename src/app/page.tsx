'use client'

import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PanelLeft, Download } from 'lucide-react'
import { db } from '@/lib/db'
import { Sidebar } from '@/components/sidebar/sidebar'
import { SettingsDialog } from '@/components/settings-dialog'
import { Chat, type ChatHandle } from '@/components/chat/chat'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [chatKey, setChatKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const chatRef = useRef<ChatHandle>(null)

  const conversations = useLiveQuery(
    () => db.conversations.orderBy('updatedAt').reverse().toArray(),
    [],
  )

  function handleNewChat() {
    setActiveConvId(null)
    setChatKey((k) => k + 1)
  }

  function handleSelectConv(id: string) {
    if (id === activeConvId) return
    setActiveConvId(id)
    setChatKey((k) => k + 1)
  }

  async function handleDeleteConv(id: string) {
    await db.messages.where('conversationId').equals(id).delete()
    await db.conversations.delete(id)
    if (activeConvId === id) handleNewChat()
  }

  const activeTitle = conversations?.find((c) => c.id === activeConvId)?.title

  return (
    <div className="flex h-full">
      {sidebarOpen && (
        <Sidebar
          conversations={conversations ?? []}
          activeId={activeConvId}
          onSelect={handleSelectConv}
          onNew={handleNewChat}
          onDelete={handleDeleteConv}
        />
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-2 border-b px-3 py-2 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <span className="flex-1 truncate font-semibold tracking-tight text-sm">
            {activeTitle ?? 'Helios'}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => chatRef.current?.exportMarkdown()}
            aria-label="Export conversation"
          >
            <Download className="h-4 w-4" />
          </Button>
          <SettingsDialog />
        </header>

        <Chat
          ref={chatRef}
          key={chatKey}
          conversationId={activeConvId}
          onConversationCreated={setActiveConvId}
          title={activeTitle}
        />
      </div>
    </div>
  )
}
