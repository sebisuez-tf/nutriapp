'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check, CheckCheck } from 'lucide-react'

interface MessageBubbleProps {
  content: string
  createdAt: Date
  isOwn: boolean
  isRead?: boolean
  senderName?: string
}

export function MessageBubble({
  content,
  createdAt,
  isOwn,
  isRead,
  senderName,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] space-y-0.5 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}
      >
        {senderName && !isOwn && (
          <span className="ml-1 text-xs font-medium text-gray-500">{senderName}</span>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            isOwn
              ? 'rounded-br-sm bg-green-600 text-white'
              : 'rounded-bl-sm bg-gray-100 text-gray-800'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
        <div
          className={`flex items-center gap-1 px-1 text-xs text-gray-400 ${
            isOwn ? 'flex-row-reverse' : ''
          }`}
        >
          <span>
            {format(new Date(createdAt), 'HH:mm', { locale: es })}
          </span>
          {isOwn && (
            <span>
              {isRead ? (
                <CheckCheck className="h-3 w-3 text-green-500" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
