import Dexie, { type Table } from 'dexie'

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export interface DbMessage {
  id: string
  conversationId: string
  role: 'user' | 'model'
  text: string
  createdAt: number
}

class HeliosDB extends Dexie {
  conversations!: Table<Conversation>
  messages!: Table<DbMessage>

  constructor() {
    super('helios')
    this.version(1).stores({
      conversations: 'id, updatedAt',
      messages: 'id, conversationId, createdAt',
    })
  }
}

export const db = new HeliosDB()
