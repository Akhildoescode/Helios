'use client'

import { useRef, useEffect, useState } from 'react'
import { ArrowUp, Square, Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

interface Props {
  onSend: (text: string, imageData?: string, imageMimeType?: string) => void
  onStop: () => void
  isLoading: boolean
}

export function ChatInput({ onSend, onStop, isLoading }: Props) {
  const [text, setText] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageData, setImageData] = useState<string | null>(null)
  const [imageMimeType, setImageMimeType] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [text])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const trimmed = text.trim()
    if ((!trimmed && !imageData) || isLoading) return
    onSend(trimmed, imageData ?? undefined, imageMimeType ?? undefined)
    setText('')
    clearImage()
  }

  function clearImage() {
    setImagePreview(null)
    setImageData(null)
    setImageMimeType(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function attachImage(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be under 4 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImageData(dataUrl.split(',')[1])
      setImageMimeType(file.type)
      setImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) attachImage(file)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageItem = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
    if (imageItem) {
      const file = imageItem.getAsFile()
      if (file) attachImage(file)
    }
  }

  return (
    <div className="shrink-0 border-t bg-background px-4 py-3">
      <div className="mx-auto max-w-3xl">
        {imagePreview && (
          <div className="mb-2">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Attachment preview"
                className="h-20 w-20 rounded-lg object-cover border"
              />
              <button
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border flex items-center justify-center hover:bg-muted transition-colors"
                onClick={clearImage}
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
        <div className="flex items-end gap-2 rounded-xl border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring transition-shadow">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image"
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Message Helios…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-50 min-h-[1.5rem] max-h-[200px]"
          />
          {isLoading ? (
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7 shrink-0 rounded-lg"
              onClick={onStop}
              aria-label="Stop generation"
            >
              <Square className="h-3 w-3 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-7 w-7 shrink-0 rounded-lg"
              disabled={text.trim().length === 0 && !imageData}
              onClick={submit}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Helios can make mistakes. Shift+Enter for a new line.
        </p>
      </div>
    </div>
  )
}
