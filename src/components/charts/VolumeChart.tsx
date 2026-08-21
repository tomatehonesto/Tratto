import { useId } from 'react'
import type { MonthBucket } from '@/data/api'

const SERIES = [
  { key: 'negocios', label: 'Negócios', color: 'var(--chart-1)' },
  { key: 'certidoes', label: 'Certidões', color: 'var(--chart-2)' },
  { key: 'documentos', label: 'Documentos', color: 'var(--chart-3)' },
] as const

/**
 * Barras agrupadas por mês, alimentadas pelos dados reais do banco.
 * A escala se ajusta ao maior valor presente — com pouco volume o gráfico
 * fica baixo, o que é a leitura correta e não um defeito de renderização.
 */
export function VolumeChart({ data }: { data: MonthBucket[] }) {
  const id = useId()
  const W = 720
  const H = 200
  const padLeft = 26
  const padBottom = 22
  const plotW = W - padLeft
  const plotH = H - padBottom
  const slot = plotW / Math.max(data.length, 1)
  const barW = 7
  const gap = 3
  const groupW = SERIES.length * barW + (SERIES.length - 1) * gap

  const peak = Math.max(...data.flatMap((m) => SERIES.map((s) => m[s.key])), 0)
  // Arredonda para cima num múltiplo de 4, para os ticks caírem redondos.
  const max = Math.max(4, Math.ceil(peak / 4) * 4)
  const ticks = [max, max / 2, 0]

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-labelledby={id}>
        <title id={id}>Volume mensal de negócios, certidões e documentos nos últimos 12 meses</title>

        {ticks.map((t) => {
          const y = plotH - (t / max) * plotH
          return (
            <g key={t}>
              <line x1={padLeft} x2={W} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text x={padLeft - 8} y={y + 3.5} textAnchor="end" fontSize={10} fill="var(--muted-foreground)">
                {t}
              </text>
            </g>
          )
        })}

        {data.map((m, i) => {
          const cx = padLeft + slot * i + slot / 2
          const startX = cx - groupW / 2
          return (
            <g key={`${m.month}-${i}`}>
              {SERIES.map((s, si) => {
                const value = m[s.key]
                const h = (value / max) * plotH
                const x = startX + si * (barW + gap)
                return (
                  <rect key={s.key} x={x} y={plotH - h} width={barW} height={h} rx={2} fill={s.color}>
                    <title>{`${m.month} · ${s.label}: ${value}`}</title>
                  </rect>
                )
              })}
              <text x={cx} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
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
