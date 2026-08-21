import { Loader2, AlertTriangle, Inbox } from 'lucide-react'
import { Card, CardBody } from './card'
import { Button } from './button'

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <Card>
      <CardBody className="flex items-center justify-center gap-2.5 py-20 text-[13px] text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {label}
      </CardBody>
    </Card>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-[#ef444433] bg-danger-soft">
      <CardBody className="flex items-start gap-3 py-6">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#b91c1c]" />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#b91c1c]">Não foi possível carregar</p>
          <p className="mt-1 text-[13px] text-[#991b1b]">{message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </CardBody>
    </Card>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardBody className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Inbox className="size-5 text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">{message}</p>
      </CardBody>
    </Card>
  )
}
