import { SettingsDialog } from '@/components/settings-dialog'

export default function Home() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <span className="font-semibold tracking-tight">Helios</span>
        <SettingsDialog />
      </header>

      {/* Chat area placeholder — filled in Phase 2 */}
      <main className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Enter your API key in settings to get started.
      </main>
    </div>
  )
}
