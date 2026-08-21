import { useId } from 'react'
import { monthlyVolume } from '@/data/deals'

const SERIES = [
  { key: 'negocios', label: 'Negócios', color: 'var(--chart-1)' },
  { key: 'certidoes', label: 'Certidões', color: 'var(--chart-2)' },
  { key: 'documentos', label: 'Documentos', color: 'var(--chart-3)' },
] as const

const MAX = 16
const TICKS = [16, 8, 0]

/**
 * Barras agrupadas por mês. Desenhado em SVG com viewBox proporcional —
 * escala com a largura do card sem depender de medição em runtime.
 */
export function VolumeChart() {
  const id = useId()
  const W = 720
  const H = 200
  const padLeft = 26
  const padBottom = 22
  const plotW = W - padLeft
  const plotH = H - padBottom
  const slot = plotW / monthlyVolume.length
  const barW = 7
  const gap = 3
  const groupW = SERIES.length * barW + (SERIES.length - 1) * gap

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-labelledby={id}>
        <title id={id}>Volume mensal de negócios, certidões e documentos nos últimos 12 meses</title>

        {TICKS.map((t) => {
          const y = plotH - (t / MAX) * plotH
          return (
            <g key={t}>
              <line x1={padLeft} x2={W} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text
                x={padLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize={10}
                fill="var(--muted-foreground)"
              >
                {t}
              </text>
            </g>
          )
        })}

        {monthlyVolume.map((m, i) => {
          const cx = padLeft + slot * i + slot / 2
          const startX = cx - groupW / 2
          return (
            <g key={m.month}>
              {SERIES.map((s, si) => {
                const value = m[s.key]
                const h = (value / MAX) * plotH
                const x = startX + si * (barW + gap)
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={plotH - h}
                    width={barW}
                    height={h}
                    rx={2}
                    fill={s.color}
                  >
                    <title>{`${m.month} · ${s.label}: ${value}`}</title>
                  </rect>
                )
              })}
              <text
                x={cx}
                y={H - 6}
                textAnchor="middle"
                fontSize={10}
                fill="var(--muted-foreground)"
              >
                {m.month}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="mt-3 flex items-center gap-5">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span className="size-2 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
