'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSettingsStore } from '@/store/settings'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

interface GeminiModel {
  name: string
  displayName: string
  supportedGenerationMethods: string[]
}

type TestStatus = 'idle' | 'loading' | 'ok' | 'error'

export function SettingsDialog() {
  const { setTheme } = useTheme()
  const store = useSettingsStore()

  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState(store.apiKey)
  const [showKey, setShowKey] = useState(false)
  const [models, setModels] = useState<GeminiModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testError, setTestError] = useState('')

  const fetchModels = useCallback(async (key: string) => {
    if (!key) return
    setModelsLoading(true)
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      )
      if (!res.ok) throw new Error('Failed to fetch models')
      const data = await res.json()
      const filtered: GeminiModel[] = (data.models ?? []).filter((m: GeminiModel) =>
        m.supportedGenerationMethods?.includes('generateContent')
      )
      setModels(filtered)
    } catch {
      // silently ignore — user will see error on test
    } finally {
      setModelsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && store.apiKey) fetchModels(store.apiKey)
  }, [open, store.apiKey, fetchModels])

  function handleOpenChange(val: boolean) {
    if (!val) store.setApiKey(apiKey)
    else setApiKey(store.apiKey)
    setOpen(val)
    setTestStatus('idle')
  }

  async function handleTestConnection() {
    const key = apiKey.trim()
    if (!key) return
    store.setApiKey(key)
    setTestStatus('loading')
    setTestError('')
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`)
      }
      setTestStatus('ok')
      await fetchModels(key)
    } catch (e) {
      setTestStatus('error')
      setTestError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  function handleThemeChange(value: string) {
    const t = value as 'light' | 'dark' | 'system'
    store.setTheme(t)
    setTheme(t)
  }

  const selectedModelLabel =
    models.find((m) => m.name.split('/').pop() === store.model)?.displayName ?? store.model

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Settings"
        onClick={() => setOpen(true)}
      >
        <Settings className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key">Gemini API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showKey ? 'text' : 'password'}
                    placeholder="AIza..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onBlur={() => store.setApiKey(apiKey)}
                    className="pr-10"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={!apiKey.trim() || testStatus === 'loading'}
                  className="shrink-0"
                >
                  {testStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  {testStatus === 'ok' && <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />}
                  {testStatus === 'error' && <XCircle className="h-4 w-4 text-red-500 mr-1" />}
                  Test
                </Button>
              </div>
              {testStatus === 'ok' && (
                <p className="text-xs text-green-600 dark:text-green-400">Connection successful</p>
              )}
              {testStatus === 'error' && (
                <p className="text-xs text-red-500">{testError || 'Connection failed'}</p>
              )}
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label>Model</Label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex h-8 w-full items-center justify-between rounded-lg border border-border bg-background px-2.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={modelsLoading}
                >
                  {modelsLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Fetching models…
                    </span>
                  ) : (
                    <span className="truncate">{selectedModelLabel}</span>
                  )}
                  <svg className="h-4 w-4 shrink-0 opacity-50 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup
                    value={store.model}
                    onValueChange={(v) => store.setModel(String(v))}
                  >
                    {models.length === 0 && (
                      <DropdownMenuRadioItem value={store.model}>
                        {store.model}
                      </DropdownMenuRadioItem>
                    )}
                    {models.map((m) => {
                      const id = m.name.split('/').pop() ?? m.name
                      return (
                        <DropdownMenuRadioItem key={m.name} value={id}>
                          {m.displayName}
                        </DropdownMenuRadioItem>
                      )
                    })}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Temperature</Label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {store.temperature.toFixed(2)}
                </span>
              </div>
              <Slider
                min={0}
                max={2}
                step={0.05}
                value={[store.temperature]}
                onValueChange={(v) => store.setTemperature(Array.isArray(v) ? v[0] : v)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max output tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                min={1}
                max={65536}
                value={store.maxTokens}
                onChange={(e) => store.setMaxTokens(Number(e.target.value))}
              />
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="system-prompt">System prompt</Label>
              <Textarea
                id="system-prompt"
                rows={4}
                placeholder="You are a helpful assistant…"
                value={store.systemPrompt}
                onChange={(e) => store.setSystemPrompt(e.target.value)}
                className="resize-none"
              />
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <Button
                    key={t}
                    variant={store.theme === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange(t)}
                    className="flex-1 capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
