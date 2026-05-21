'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { sendMessageAction, markMessagesReadAction } from '@/lib/actions/messages'

interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  patient_id: string
  content: string
  is_read: boolean
  read_at: Date | null
  created_at: Date
}

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  sendMessage: (content: string) => Promise<void>
  markAsRead: (readerId: string) => Promise<void>
}

export function useChat(nutritionistId: string, patientId: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadMessages() {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('patient_id', patientId)
          .eq('nutritionist_id', nutritionistId)
          .order('created_at', { ascending: true })
          .limit(50)

        if (!mounted) return

        if (error) {
          console.error('Error loading messages:', error)
        } else {
          setMessages(data ?? [])
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadMessages()

    // Subscribe to new messages via Realtime
    const channel = supabase
      .channel(`messages:${nutritionistId}:${patientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          if (!mounted) return
          const newMessage = payload.new as ChatMessage
          if (newMessage.nutritionist_id === nutritionistId) {
            setMessages((prev) => [...prev, newMessage])
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [nutritionistId, patientId])

  const sendMessage = useCallback(
    async (content: string) => {
      const result = await sendMessageAction(patientId, content)
      if (!result.success) {
        throw new Error(result.error)
      }
    },
    [patientId]
  )

  const markAsRead = useCallback(
    async (readerId: string) => {
      await markMessagesReadAction(patientId, readerId)
    },
    [patientId]
  )

  return { messages, isLoading, sendMessage, markAsRead }
}
