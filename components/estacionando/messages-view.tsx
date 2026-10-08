'use client'

import { useEffect, useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send, UserRound } from 'lucide-react'
import { PageShell } from './page-shell'
import { sendMessageAction, markConversationReadAction, fetchConversationThreadAction } from '@/lib/messages/actions'
import { useRealtimeEvent } from '@/hooks/use-realtime-refresh'
import type { ConversationPreview, ConversationThread } from '@/lib/messages/queries'
import type { SessionUser } from '@/lib/auth/types'

const relativeTimeFormatter = new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' })
function formatRelative(date: Date) {
  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60_000)
  if (Math.abs(diffMinutes) < 60) return relativeTimeFormatter.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return relativeTimeFormatter.format(diffHours, 'hour')
  return relativeTimeFormatter.format(Math.round(diffHours / 24), 'day')
}
const timeFormatter = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' })

export function MessagesView({
  user,
  conversations,
  initialConversationId,
}: {
  user: SessionUser | null
  conversations: ConversationPreview[]
  initialConversationId: string | null
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId)
  const [thread, setThread] = useState<ConversationThread | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)
  const [body, setBody] = useState('')
  const [, startTransition] = useTransition()

  async function loadThread(id: string) {
    setLoadingThread(true)
    const result = await fetchConversationThreadAction(id)
    setThread(result)
    setLoadingThread(false)
    if (result) {
      const formData = new FormData()
      formData.set('conversationId', id)
      markConversationReadAction(undefined, formData)
    }
  }

  useEffect(() => {
    if (selectedId) loadThread(selectedId)
    else setThread(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useRealtimeEvent(['messages'], () => {
    if (selectedId) loadThread(selectedId)
  })

  function handleSend(event: FormEvent) {
    event.preventDefault()
    if (!selectedId || !body.trim()) return
    const text = body.trim()
    setBody('')
    const formData = new FormData()
    formData.set('conversationId', selectedId)
    formData.set('body', text)
    startTransition(async () => {
      await sendMessageAction(undefined, formData)
      await loadThread(selectedId)
    })
  }

  if (!user) {
    return (
      <PageShell eyebrow="Tu bandeja" title="Mensajes" description="Inicia sesión para ver tus conversaciones.">
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-border bg-card text-center">
          <UserRound className="size-10 text-accent" />
          <h2 className="mt-4 text-xl font-semibold">Aún no has iniciado sesión</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Crea una cuenta o inicia sesión para ver tus mensajes.</p>
          <div className="mt-5 flex gap-3">
            <Link href="/login" className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Iniciar sesión</Link>
            <Link href="/register" className="rounded-full border border-border px-5 py-3 text-sm font-medium">Crear cuenta</Link>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell eyebrow="Tu bandeja" title="Mensajes" description="Conversaciones con anfitriones y arrendatarios, por espacio.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[.9fr_1.4fr]">
        <div className={`min-w-0 rounded-3xl border border-border bg-card ${selectedId ? 'hidden lg:block' : 'block'}`}>
          {conversations.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
              <MessageCircle className="size-10 text-accent" />
              <h2 className="mt-4 text-xl font-semibold">Aún no tienes conversaciones</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Cuando le escribas a un anfitrión, o alguien te escriba sobre tu espacio, va a aparecer acá.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {conversations.map((c) => (
                <button key={c.id} type="button" onClick={() => setSelectedId(c.id)} className={`flex items-start gap-3 p-4 text-left hover:bg-muted ${selectedId === c.id ? 'bg-muted' : ''}`}>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><UserRound className="size-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{c.otherPartyName}</p>
                      {c.unreadCount > 0 && <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">{c.unreadCount}</span>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.spotTitle}</p>
                    {c.lastMessage && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {c.lastMessage.isMine ? 'Tú: ' : ''}{c.lastMessage.body} · {formatRelative(c.lastMessage.createdAt)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`flex min-h-[28rem] min-w-0 flex-col rounded-3xl border border-border bg-card ${selectedId ? 'flex' : 'hidden lg:flex'}`}>
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">Elige una conversación para ver los mensajes.</div>
          ) : loadingThread && !thread ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">Cargando…</div>
          ) : thread ? (
            <>
              <div className="flex items-center gap-3 border-b border-border p-4">
                <button type="button" aria-label="Volver a la lista" onClick={() => setSelectedId(null)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted lg:hidden"><ArrowLeft className="size-4" /></button>
                <div className="min-w-0">
                  <p className="truncate font-medium">{thread.otherPartyName}</p>
                  <p className="truncate text-xs text-muted-foreground">{thread.spotTitle}</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
                {thread.messages.length === 0 && <p className="text-center text-xs text-muted-foreground">Todavía no hay mensajes — ¡escribe el primero!</p>}
                {thread.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.isMine ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'}`}>
                      <p className="break-words">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${m.isMine ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>{timeFormatter.format(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
                <input
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Escribe un mensaje…"
                  className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button type="submit" disabled={!body.trim()} aria-label="Enviar" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"><Send className="size-4" /></button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">No se pudo cargar la conversación.</div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
