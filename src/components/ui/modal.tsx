import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Diálogo modal sobre <dialog> nativo — traz foco preso, Esc e camada de topo
 * sem gerenciamento manual de z-index.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        // Clique no backdrop: o alvo é o próprio <dialog>, não o conteúdo.
        if (e.target === ref.current) onClose()
      }}
      className="m-auto w-full max-w-[560px] rounded-xl border border-border bg-card p-0 text-foreground shadow-[0_12px_40px_rgba(10,10,15,0.18)] backdrop:bg-[rgba(10,10,15,0.4)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-[16px] font-semibold leading-tight">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      {children}
    </dialog>
  )
}
