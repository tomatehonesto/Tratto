import { supabase } from '@/lib/supabase'
import type { DealType } from './types'

export interface InviteDetails {
  party_name: string
  party_role: string
  party_side: 'buyer' | 'seller'
  deal_type: DealType
  deal_modality: string | null
  address: string
  city: string | null
  organization: string
  expires_at: string
  completed: boolean
  documents: { name: string; uploaded_at: string }[]
}

function client() {
  if (!supabase) throw new Error('Supabase não configurado.')
  return supabase
}

/** Carrega o convite pelo token. `null` quando inválido ou expirado. */
export async function fetchInvite(token: string): Promise<InviteDetails | null> {
  const { data, error } = await client().rpc('invite_details', { p_token: token })
  if (error) throw new Error('Não foi possível carregar o convite.')
  return (data as InviteDetails | null) ?? null
}

const MAX_BYTES = 10 * 1024 * 1024
const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']

/**
 * Envia um arquivo e registra o envio.
 *
 * O caminho começa pelo token porque é assim que a policy do Storage autoriza
 * a escrita: o visitante não tem sessão, então a pasta é a credencial.
 */
export async function uploadDocumento(token: string, docName: string, file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error('Arquivo maior que 10 MB.')
  }
  if (!TIPOS_ACEITOS.includes(file.type)) {
    throw new Error('Formato não aceito. Envie PDF, JPG, PNG ou HEIC.')
  }

  const db = client()
  const extensao = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  // Nome do arquivo derivado do documento, não do original: evita caractere
  // estranho no caminho e deixa claro no Storage o que é cada arquivo.
  const slug = docName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  const path = `${token}/${slug}-${Date.now()}.${extensao}`

  const { error: upErr } = await db.storage.from('deal-documents').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (upErr) {
    throw new Error('Não foi possível enviar o arquivo. Tente novamente.')
  }

  const { error: regErr } = await db.rpc('invite_register_document', {
    p_token: token,
    p_doc_name: docName,
    p_path: path,
    p_mime: file.type,
    p_size: file.size,
  })

  if (regErr) {
    throw new Error('O arquivo subiu, mas não foi possível registrá-lo. Avise a imobiliária.')
  }
}

export interface ConviteEnviar {
  token: string
  nome: string
  email: string
  papel: string
  imovel: string
  imobiliaria: string
}

/**
 * Dispara o email de convite pela função serverless.
 *
 * Falha aqui não derruba o negócio recém-criado: o link continua válido e
 * pode ser reenviado depois.
 */
export async function enviarConvite(convite: ConviteEnviar): Promise<{ ok: boolean; erro?: string }> {
  const { data } = await client().auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) return { ok: false, erro: 'Sessão expirada.' }

  try {
    const res = await fetch('/api/enviar-convite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(convite),
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      return { ok: false, erro: body.error ?? 'Falha no envio.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, erro: 'Não foi possível contatar o servidor de envio.' }
  }
}
