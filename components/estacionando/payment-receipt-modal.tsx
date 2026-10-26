'use client'

import { BadgeCheck, X } from 'lucide-react'
import { dateFormatter, formatReservationRange, timeFormatter } from '@/lib/estacionando/format'

export type PaymentReceipt = {
  spotTitle: string
  spotArea: string
  startTime: Date
  endTime: Date
  totalPrice: number
  confirmationCode: string
  authorizationCode: string | null
  cardLastDigits: string | null
  paidAt: Date | null
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

export function PaymentReceiptModal({ receipt, onClose }: { receipt: PaymentReceipt; onClose: () => void }) {
  const paidAt = receipt.paidAt ?? new Date()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/30 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl sm:p-7" onClick={(event) => event.stopPropagation()}>
        <button aria-label="Cerrar" onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <BadgeCheck className="size-7" />
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">Pago confirmado</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {receipt.spotTitle} · {receipt.spotArea}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-muted/40 px-4 py-1">
          <Row label="Código de confirmación" value={receipt.confirmationCode} />
          <div className="border-t border-border/70" />
          <Row label="Fecha de la transacción" value={`${dateFormatter.format(paidAt)}, ${timeFormatter.format(paidAt)}`} />
          <div className="border-t border-border/70" />
          <Row label="Periodo reservado" value={formatReservationRange(receipt.startTime, receipt.endTime)} />
          {receipt.cardLastDigits && (
            <>
              <div className="border-t border-border/70" />
              <Row label="Método de pago" value={`Tarjeta •••• ${receipt.cardLastDigits}`} />
            </>
          )}
          {receipt.authorizationCode && (
            <>
              <div className="border-t border-border/70" />
              <Row label="Código de autorización" value={receipt.authorizationCode} />
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-500/10 px-4 py-3">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total pagado</span>
          <span className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">${receipt.totalPrice.toLocaleString('es-CL')}</span>
        </div>

        <button onClick={onClose} className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
          Entendido
        </button>
      </div>
    </div>
  )
}
