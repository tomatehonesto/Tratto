/**
 * Envia o convite de upload para uma parte do negócio.
 *
 * Roda como função serverless na Vercel porque a chave do Resend não pode
 * existir no bundle: qualquer pessoa a leria e mandaria email em nome da
 * Tratto. Aqui ela vem de RESEND_API_KEY, sem o prefixo VITE_, então nunca
 * chega ao navegador.
 *
 * O chamador precisa apresentar um access token válido do Supabase. Não basta
 * conhecer a URL: sem sessão, a função recusa.
 */

// Runtime edge declarado de propósito: a função só faz chamadas HTTP, e é o
// runtime onde a assinatura Request/Response é a esperada. Sem isto, a Vercel
// pode tentar compilá-la como função Node com outra assinatura.
export const config = { runtime: 'edge' }

declare const process: { env: Record<string, string | undefined> }

interface Corpo {
  token: string
  nome: string
  email: string
  papel: string
  imovel: string
  imobiliaria: string
}

const RESEND_URL = 'https://api.resend.com/emails'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido.' }, 405)
  }

  const apiKey = process.env.RESEND_API_KEY
  const remetente = process.env.INVITE_FROM_EMAIL
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY

  if (!apiKey || !remetente || !supabaseUrl || !anonKey) {
    return json({ error: 'Envio de convites não configurado no servidor.' }, 500)
  }

  // Confirma que quem chamou está autenticado de verdade.
  const auth = req.headers.get('authorization') ?? ''
  if (!auth.startsWith('Bearer ')) {
    return json({ error: 'Não autenticado.' }, 401)
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: anonKey },
  })
  if (!userRes.ok) {
    return json({ error: 'Sessão inválida.' }, 401)
  }

  let corpo: Corpo
  try {
    corpo = (await req.json()) as Corpo
  } catch {
    return json({ error: 'Corpo inválido.' }, 400)
  }

  const { token, nome, email, papel, imovel, imobiliaria } = corpo
  if (!token || !email || !nome) {
    return json({ error: 'Dados incompletos.' }, 400)
  }

  const origem = new URL(req.url).origin
  const link = `${origem}/enviar-documentos/${token}`

  const resendRes = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: remetente,
      to: [email],
      subject: `${imobiliaria}: envio de documentos — ${imovel}`,
      html: montarEmail({ nome, papel, imovel, imobiliaria, link }),
    }),
  })

  if (!resendRes.ok) {
    const detalhe = await resendRes.text()
    return json({ error: 'Falha ao enviar o email.', detalhe: detalhe.slice(0, 300) }, 502)
  }

  return json({ ok: true })
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function escapar(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

function montarEmail(d: {
  nome: string
  papel: string
  imovel: string
  imobiliaria: string
  link: string
}) {
  const nome = escapar(d.nome)
  const papel = escapar(d.papel)
  const imovel = escapar(d.imovel)
  const imobiliaria = escapar(d.imobiliaria)

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0a0a0f">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
    <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:8px;background:#0a0a0f;color:#fff;font-weight:700">T</span>
    <strong style="font-size:16px">Tratto</strong>
  </div>

  <p style="font-size:15px;line-height:1.6;margin:0 0 16px">Olá, ${nome}.</p>

  <p style="font-size:15px;line-height:1.6;margin:0 0 16px">
    A <strong>${imobiliaria}</strong> está conduzindo a documentação do imóvel
    <strong>${imovel}</strong>, e você consta como <strong>${papel}</strong>.
  </p>

  <p style="font-size:15px;line-height:1.6;margin:0 0 24px">
    Use o botão abaixo para enviar seus documentos. Não é preciso criar conta nem senha.
  </p>

  <a href="${d.link}"
     style="display:inline-block;background:#0a0a0f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">
    Enviar documentos
  </a>

  <p style="font-size:13px;line-height:1.6;color:#6b6b80;margin:28px 0 0">
    Este link é pessoal e vale por 30 dias. Não o repasse — quem tiver o endereço
    consegue enviar documentos no seu nome.
  </p>

  <p style="font-size:13px;line-height:1.6;color:#6b6b80;margin:16px 0 0">
    Se você não esperava esta mensagem, ignore-a e avise a ${imobiliaria}.
  </p>
</div>`
}
