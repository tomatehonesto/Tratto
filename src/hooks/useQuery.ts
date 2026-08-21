import { useCallback, useEffect, useState } from 'react'

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Busca simples com estado de carregamento e erro.
 *
 * `fetcher` precisa ser estável — passe uma função de módulo ou memoizada,
 * senão o efeito redispara a cada render. O flag `active` descarta respostas
 * de requisições antigas, evitando que uma lenta sobrescreva uma recente.
 */
export function useQuery<T>(fetcher: () => Promise<T>): QueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Erro inesperado.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [fetcher, nonce])

  return { data, loading, error, reload }
}
