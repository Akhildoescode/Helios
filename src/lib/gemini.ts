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

export async function generateReply(args: GenerateArgs): Promise<string> {
  const chat = buildChat(args)
  const response = await chat.sendMessage({ message: args.userText })
  return response.text ?? ''
}

export async function* generateReplyStream(
  args: GenerateArgs,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const chat = buildChat(args)
  const stream = await chat.sendMessageStream({ message: args.userText })
  for await (const chunk of stream) {
    if (signal?.aborted) break
    yield chunk.text ?? ''
  }
}
