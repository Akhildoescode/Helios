# Helios — Gemini Chat App

Claude-style chat web app powered by the Google Gemini API.

## Architecture

**Pure client-side** — no backend, no API routes, no auth. All data lives in the browser.

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand (settings) |
| Persistence | Dexie (IndexedDB) for conversations/messages |
| Gemini SDK | @google/genai (unified SDK) |
| Themes | next-themes |
| Markdown | react-markdown + remark-gfm + remark-math + rehype-katex |
| Code highlighting | Shiki |
| Toast | Sonner |

## File Conventions

```
src/
  app/
    layout.tsx          – Root layout (ThemeProvider, TooltipProvider, Toaster)
    page.tsx            – Main chat page
    globals.css         – Tailwind + shadcn CSS vars
  components/
    providers.tsx       – Client-side provider wrapper
    settings-dialog.tsx – Gear-icon settings panel
    chat/               – Chat UI components (Phase 2+)
    sidebar/            – Sidebar components (Phase 4+)
    ui/                 – shadcn primitives
  store/
    settings.ts         – Zustand store (localStorage via persist)
  lib/
    db.ts               – Dexie schema (Phase 4)
    gemini.ts           – Gemini API helpers
    utils.ts            – cn() helper (shadcn)
```

## Key Rules

- API key **never** leaves the browser — stored only in localStorage at runtime.
- No secrets in committed files.
- No backend, no API routes, no auth.

## Phase Plan

| Phase | Feature |
|---|---|
| 0 | Git setup |
| 1 | Scaffold + settings dialog ✓ |
| 2 | Basic multi-turn chat (no streaming) |
| 3 | Streaming + stop/regenerate/edit |
| 4 | Sidebar + Dexie persistence |
| 5 | Image input, toasts, markdown export |
