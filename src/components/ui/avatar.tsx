import { cn } from '@/lib/utils'

const palette = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ec4899']

/** Cor estável por iniciais — mesma pessoa, mesma cor em toda a plataforma. */
function colorFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

export function Avatar({
  initials,
  size = 28,
  className,
}: {
  initials: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        backgroundColor: colorFor(initials),
      }}
    >
      {initials}
    </span>
  )
}

export function AvatarPair({ a, b }: { a: string; b: string }) {
  return (
    <span className="flex items-center">
      <Avatar initials={a} size={26} className="ring-2 ring-card" />
      <Avatar initials={b} size={26} className="-ml-2 ring-2 ring-card" />
    </span>
  )
}
