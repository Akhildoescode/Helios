import { SettingsDialog } from '@/components/settings-dialog'
import { Chat } from '@/components/chat/chat'

export default function Home() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <span className="font-semibold tracking-tight">Helios</span>
        <SettingsDialog />
      </header>
      <Chat />
    </div>
  )
}
