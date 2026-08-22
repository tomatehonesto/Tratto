export interface Endereco {
  cep: string
  street: string
  district: string
  city: string
  uf: string
}

interface ViaCepResposta {
  erro?: boolean | string
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

interface BrasilApiResposta {
  cep?: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
}

/**
 * Consulta CEP em dois provedores gratuitos e sem chave.
 *
 * ViaCEP primeiro por ser o mais estável; BrasilAPI como reserva, já que ela
 * agrega várias fontes e às vezes resolve CEP que o ViaCEP não tem. Um CEP
 * inexistente devolve `null` — não é erro, é resultado vazio.
 */
export async function buscarCep(cep: string, signal?: AbortSignal): Promise<Endereco | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal })
    if (res.ok) {
      const data: ViaCepResposta = await res.json()
      // ViaCEP responde 200 com { erro: true } quando o CEP não existe.
      if (!data.erro && data.logradouro !== undefined) {
        return {
          cep: data.cep ?? digits,
          street: data.logradouro ?? '',
          district: data.bairro ?? '',
          city: data.localidade ?? '',
          uf: data.uf ?? '',
        }
      }
      if (data.erro) return null
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    // Cai para a reserva.
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, { signal })
    if (!res.ok) return null
    const data: BrasilApiResposta = await res.json()
    return {
      cep: data.cep ?? digits,
      street: data.street ?? '',
      district: data.neighborhood ?? '',
      city: data.city ?? '',
      uf: data.state ?? '',
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new Error('Não foi possível consultar o CEP.')
  }
}

/** Monta a linha de endereço exibida nas listagens. */
export function composeAddress(street: string, number: string, complement: string) {
  const base = [street.trim(), number.trim()].filter(Boolean).join(', ')
  const comp = complement.trim()
  return comp ? `${base} – ${comp}` : base
}
