'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  theme: Theme
  setApiKey: (key: string) => void
  setModel: (model: string) => void
  setTemperature: (temp: number) => void
  setMaxTokens: (tokens: number) => void
  setSystemPrompt: (prompt: string) => void
  setTheme: (theme: Theme) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      model: 'gemini-2.0-flash',
      temperature: 1,
      maxTokens: 8192,
      systemPrompt: '',
      theme: 'system' as Theme,
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'helios-settings',
      partialize: ({ apiKey, model, temperature, maxTokens, systemPrompt, theme }) => ({
        apiKey, model, temperature, maxTokens, systemPrompt, theme,
      }),
    }
  )
)
