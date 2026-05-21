'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@/hooks/use-chat'
import { MessageBubble } from '@/components/shared/MessageBubble'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Send } from 'lucide-react'
import { toast } from 'sonner'

interface ChatWindowProps {
  nutritionistId: string
  patientId: string
  currentUserId: string
  patientName: string
}

export function ChatWindow({
  nutritionistId,
  patientId,
  currentUserId,
  patientName,
}: ChatWindowProps) {
  const { messages, isLoading, sendMessage, markAsRead } = useChat(nutritionistId, patientId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    markAsRead(currentUserId)
  }, [messages.length, currentUserId, markAsRead])

  async function handleSend() {
    if (!text.trim()) return
    setSending(true)
    try {
      await sendMessage(text.trim())
      setText('')
    } catch {
      toast.error('Error enviando mensaje')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="font-semibold text-gray-900">{patientName}</p>
        <p className="text-xs text-gray-400">Chat en tiempo real</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400">
              Sin mensajes aún. ¡Empezá la conversación!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              createdAt={msg.created_at}
              isOwn={msg.sender_id === currentUserId}
              isRead={msg.is_read}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje..."
          disabled={sending}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
