import { GoogleGenAI } from '@google/genai'

export type Role = 'user' | 'model'

export interface ChatTurn {
  role: Role
  text: string
}

interface GenerateArgs {
  apiKey: string
  model: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  history: ChatTurn[]
  userText: string
  imageData?: string
  imageMimeType?: string
}

function buildChat(args: GenerateArgs) {
  const { apiKey, model, systemPrompt, temperature, maxTokens, history } = args
  const ai = new GoogleGenAI({ apiKey })
  return ai.chats.create({
    model,
    config: {
      ...(systemPrompt && { systemInstruction: systemPrompt }),
      temperature,
      maxOutputTokens: maxTokens,
    },
    history: history.map(({ role, text }) => ({ role, parts: [{ text }] })),
  })
}

function buildMessage(args: GenerateArgs) {
  if (!args.imageData || !args.imageMimeType) return args.userText
  const parts: object[] = [
    { inlineData: { mimeType: args.imageMimeType, data: args.imageData } },
  ]
  if (args.userText.trim()) parts.push({ text: args.userText })
  return parts
}

export async function generateReply(args: GenerateArgs): Promise<string> {
  const chat = buildChat(args)
  const response = await chat.sendMessage({ message: buildMessage(args) })
  return response.text ?? ''
}

export async function* generateReplyStream(
  args: GenerateArgs,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const chat = buildChat(args)
  const stream = await chat.sendMessageStream({ message: buildMessage(args) })
  for await (const chunk of stream) {
    if (signal?.aborted) break
    yield chunk.text ?? ''
  }
}
