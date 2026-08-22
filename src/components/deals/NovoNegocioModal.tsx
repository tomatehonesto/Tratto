import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2, Check, AlertCircle, ArrowRight, ArrowLeft, CircleCheck } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/field'
import { TextField, FormError } from '@/components/auth/AuthShell'
import { createDeal } from '@/data/api'
import { enviarConvite } from '@/data/convites'
import { buscarCep, composeAddress } from '@/lib/cep'
import { formatCurrencyInput, parseCurrencyInput, formatCep, cepDigits, formatPhone } from '@/lib/masks'
import { cn } from '@/lib/utils'
import type { DealType, DealStage } from '@/data/types'

const TYPES: DealType[] = ['Compra e Venda', 'Locação', 'Permuta']
const STAGES: DealStage[] = ['Coleta de documentos', 'Certidões', 'Revisão', 'Assinatura']

const MODALIDADES = [
  { value: 'Direta', label: 'Direta', hint: 'Pagamento à vista ou parcelado' },
  { value: 'Financiamento', label: 'Financiamento', hint: 'Via banco (CEF, BB, Itaú…)' },
]

const ROLES: Record<DealType, { buyer: string; seller: string }> = {
  'Compra e Venda': { buyer: 'Comprador', seller: 'Vendedor' },
  Locação: { buyer: 'Locatário', seller: 'Locador' },
  Permuta: { buyer: 'Permutante A', seller: 'Permutante B' },
  Auditoria: { buyer: 'Contratante', seller: 'Proprietário' },
}

const PASSOS = ['Operação', 'Participantes', 'Condições']

type CepState = 'idle' | 'buscando' | 'ok' | 'nao-encontrado' | 'erro'

export function NovoNegocioModal({
  open,
  onClose,
  onCreated,
  organizationName,
}: {
  open: boolean
  onClose: () => void
  onCreated: (reference: string, avisos: string[]) => void
  organizationName: string
}) {
  const [passo, setPasso] = useState(0)

  const [type, setType] = useState<DealType>('Compra e Venda')
  const [modality, setModality] = useState('Direta')
  const [stage, setStage] = useState<DealStage>('Coleta de documentos')

  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('')
  const [uf, setUf] = useState('')
  const [cepState, setCepState] = useState<CepState>('idle')

  const [brokerName, setBrokerName] = useState('')
  const [lawyerName, setLawyerName] = useState('')

  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' })
  const [seller, setSeller] = useState({ name: '', email: '', phone: '' })

  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const numberRef = useRef<HTMLInputElement>(null)
  const roles = ROLES[type]
  const recurring = type === 'Locação'

  useEffect(() => {
    const digits = cepDigits(cep)
    if (digits.length !== 8) {
      setCepState('idle')
      return
    }

    const controller = new AbortController()
    setCepState('buscando')

    buscarCep(digits, controller.signal)
      .then((endereco) => {
        if (controller.signal.aborted) return
        if (!endereco) {
          setCepState('nao-encontrado')
          return
        }
        setStreet(endereco.street)
        setDistrict(endereco.district)
        setCity(endereco.city)
        setUf(endereco.uf)
        setCepState('ok')
        numberRef.current?.focus()
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setCepState('erro')
      })

    return () => controller.abort()
  }, [cep])

  function reset() {
    setPasso(0)
    setType('Compra e Venda')
    setModality('Direta')
    setStage('Coleta de documentos')
    setCep('')
    setStreet('')
    setNumber('')
    setComplement('')
    setDistrict('')
    setCity('')
    setUf('')
    setCepState('idle')
    setBrokerName('')
    setLawyerName('')
    setBuyer({ name: '', email: '', phone: '' })
    setSeller({ name: '', email: '', phone: '' })
    setValue('')
    setError(null)
  }

  function avancar() {
    setError(null)
    if (passo === 0) {
      if (!street.trim()) return setError('Informe o endereço do imóvel.')
      setPasso(1)
      return
    }
    if (passo === 1) {
      if (!buyer.name.trim() || !seller.name.trim()) {
        return setError('Informe o nome das duas partes.')
      }
      if (!buyer.email.trim() || !seller.email.trim()) {
        return setError('O email é obrigatório: é por ele que o convite de documentos é enviado.')
      }
      setPasso(2)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const numeric = parseCurrencyInput(value)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return setError('Informe um valor válido.')
    }

    setSaving(true)
    const endereco = composeAddress(street, number, complement)

    try {
      const criado = await createDeal({
        type,
        modality,
        address: endereco,
        cep: cepDigits(cep),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        district: district.trim(),
        city: city.trim(),
        uf: uf.trim(),
        brokerName: brokerName.trim(),
        lawyerName: lawyerName.trim(),
        value: numeric,
        recurring,
        stage,
        buyer: { ...buyer, name: buyer.name.trim(), role: roles.buyer },
        seller: { ...seller, name: seller.name.trim(), role: roles.seller },
      })

      // O negócio já existe. Falha de email não desfaz nada — o link segue
      // válido e reenviável, então só avisamos.
      const avisos: string[] = []
      const envios = await Promise.all([
        enviarConvite({
          token: criado.buyerToken,
          nome: buyer.name.trim(),
          email: buyer.email.trim(),
          papel: roles.buyer,
          imovel: endereco,
          imobiliaria: organizationName,
        }),
        enviarConvite({
          token: criado.sellerToken,
          nome: seller.name.trim(),
          email: seller.email.trim(),
          papel: roles.seller,
          imovel: endereco,
          imobiliaria: organizationName,
        }),
      ])

      if (!envios[0].ok) avisos.push(`Convite ao ${roles.buyer.toLowerCase()} não saiu: ${envios[0].erro}`)
      if (!envios[1].ok) avisos.push(`Convite ao ${roles.seller.toLowerCase()} não saiu: ${envios[1].erro}`)

      reset()
      onCreated(criado.reference, avisos)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado.')
    } finally {
      setSaving(false)
    }
  }

  const cepHint = {
    idle: 'Preenche rua, bairro e cidade automaticamente.',
    buscando: 'Buscando endereço...',
    ok: 'Endereço encontrado.',
    'nao-encontrado': 'CEP não encontrado. Preencha manualmente.',
    erro: 'Não foi possível consultar. Preencha manualmente.',
  }[cepState]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo negócio"
      description={`Passo ${passo + 1} de 3 — ${PASSOS[passo]}`}
    >
      <div className="flex gap-1.5 px-6 pt-4">
        {PASSOS.map((p, i) => (
          <div key={p} className="flex-1">
            <div
              className={cn(
                'h-[3px] rounded-full transition-colors',
                i <= passo ? 'bg-chart-1' : 'bg-muted',
              )}
            />
            <p
              className={cn(
                'mt-1.5 text-[11px] font-medium',
                i === passo ? 'text-chart-1' : 'text-muted-foreground',
              )}
            >
              {p}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-h-[56vh] space-y-4 overflow-y-auto px-6 py-5">
          {passo === 0 && (
            <>
              <Grupo label="Tipo de operação">
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((t) => (
                    <Opcao key={t} ativo={type === t} onClick={() => setType(t)} label={t} />
                  ))}
                </div>
              </Grupo>

              <Grupo label="Modalidade">
                <div className="grid grid-cols-2 gap-2">
                  {MODALIDADES.map((m) => (
                    <Opcao
                      key={m.value}
                      ativo={modality === m.value}
                      onClick={() => setModality(m.value)}
                      label={m.label}
                      hint={m.hint}
                    />
                  ))}
                </div>
              </Grupo>

              <div className="grid grid-cols-[160px_1fr] gap-4">
                <div>
                  <label htmlFor="cep" className="mb-1.5 block text-[13px] font-medium">
                    CEP
                  </label>
                  <div className="relative">
                    <input
                      id="cep"
                      inputMode="numeric"
                      value={cep}
                      onChange={(e) => setCep(formatCep(e.target.value))}
                      disabled={saving}
                      placeholder="01310-100"
                      className="h-10 w-full rounded-lg bg-input-background px-3 pr-9 text-[14px] outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {cepState === 'buscando' && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                      {cepState === 'ok' && <Check className="size-4 text-[#10b981]" />}
                      {(cepState === 'nao-encontrado' || cepState === 'erro') && (
                        <AlertCircle className="size-4 text-[#f59e0b]" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-end">
                  <p
                    className={cn(
                      'pb-2.5 text-[12px]',
                      cepState === 'nao-encontrado' || cepState === 'erro'
                        ? 'text-[#b45309]'
                        : 'text-muted-foreground',
                    )}
                  >
                    {cepHint}
                  </p>
                </div>
              </div>

              <TextField
                id="street"
                label="Logradouro"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                disabled={saving}
                placeholder="Rua Vergueiro"
              />

              <div className="grid grid-cols-[120px_1fr] gap-4">
                <TextField
                  id="number"
                  label="Número"
                  ref={numberRef}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  disabled={saving}
                  placeholder="1200"
                />
                <TextField
                  id="complement"
                  label="Complemento"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  disabled={saving}
                  placeholder="Apto 302"
                />
              </div>

              <div className="grid grid-cols-[1fr_1fr_80px] gap-4">
                <TextField
                  id="district"
                  label="Bairro"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={saving}
                />
                <TextField
                  id="city"
                  label="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={saving}
                />
                <TextField
                  id="uf"
                  label="UF"
                  maxLength={2}
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  id="broker"
                  label="Corretor responsável"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  disabled={saving}
                  placeholder="Nome do corretor"
                />
                <TextField
                  id="lawyer"
                  label="Jurídico responsável"
                  value={lawyerName}
                  onChange={(e) => setLawyerName(e.target.value)}
                  disabled={saving}
                  placeholder="Nome do advogado"
                />
              </div>
            </>
          )}

          {passo === 1 && (
            <>
              <ParteFields
                titulo={roles.buyer}
                valor={buyer}
                onChange={setBuyer}
                disabled={saving}
                prefixo="buyer"
              />
              <ParteFields
                titulo={roles.seller}
                valor={seller}
                onChange={setSeller}
                disabled={saving}
                prefixo="seller"
              />
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Cada parte recebe por email um link pessoal para enviar os documentos. Não é
                preciso criar conta, e o link vale por 30 dias.
              </p>
            </>
          )}

          {passo === 2 && (
            <>
              <div>
                <label htmlFor="value" className="mb-1.5 block text-[13px] font-medium">
                  {recurring ? 'Valor do aluguel (mensal)' : 'Valor do imóvel'}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-muted-foreground">
                    R$
                  </span>
                  <input
                    id="value"
                    inputMode="decimal"
                    required
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(formatCurrencyInput(e.target.value))}
                    disabled={saving}
                    placeholder={recurring ? '12.500' : '850.000'}
                    className="h-10 w-full rounded-lg bg-input-background pl-10 pr-3 text-[14px] tabular-nums outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="stage" className="mb-1.5 block text-[13px] font-medium">
                  Etapa inicial
                </label>
                <Select
                  id="stage"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as DealStage)}
                  disabled={saving}
                  className="h-10 w-full"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="rounded-lg bg-info-soft px-4 py-3.5">
                <p className="text-[13px] font-semibold text-[#4338ca]">
                  O que acontece automaticamente
                </p>
                <ul className="mt-2 space-y-1.5">
                  {[
                    'Número do negócio gerado',
                    'Checklist criado a partir da etapa',
                    `Convites enviados por email para ${roles.buyer.toLowerCase()} e ${roles.seller.toLowerCase()}`,
                    'Coleta de documentos liberada para as partes',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-[13px] text-[#4338ca]">
                      <CircleCheck className="mt-0.5 size-3.5 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {error && <FormError>{error}</FormError>}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (passo === 0 ? onClose() : setPasso(passo - 1))}
            disabled={saving}
          >
            {passo === 0 ? (
              'Cancelar'
            ) : (
              <>
                <ArrowLeft /> Voltar
              </>
            )}
          </Button>

          {passo < 2 ? (
            <Button type="button" variant="primary" onClick={avancar}>
              Continuar <ArrowRight />
            </Button>
          ) : (
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="animate-spin" /> Criando...
                </>
              ) : (
                'Criar negócio'
              )}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}

function Grupo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

function Opcao({
  ativo,
  onClick,
  label,
  hint,
}: {
  ativo: boolean
  onClick: () => void
  label: string
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-colors',
        ativo
          ? 'border-chart-1 bg-info-soft text-[#4338ca]'
          : 'border-border bg-card hover:bg-secondary',
      )}
    >
      <span className="block text-[13px] font-medium">{label}</span>
      {hint && <span className="mt-0.5 block text-[11px] text-muted-foreground">{hint}</span>}
    </button>
  )
}

function ParteFields({
  titulo,
  valor,
  onChange,
  disabled,
  prefixo,
}: {
  titulo: string
  valor: { name: string; email: string; phone: string }
  onChange: (v: { name: string; email: string; phone: string }) => void
  disabled: boolean
  prefixo: string
}) {
  return (
    <div className="rounded-lg border border-border bg-[#fafaff] p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <div className="space-y-3">
        <TextField
          id={`${prefixo}-name`}
          label="Nome completo"
          required
          value={valor.name}
          onChange={(e) => onChange({ ...valor, name: e.target.value })}
          disabled={disabled}
          placeholder="Nome completo"
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            id={`${prefixo}-email`}
            label="Email"
            type="email"
            required
            value={valor.email}
            onChange={(e) => onChange({ ...valor, email: e.target.value })}
            disabled={disabled}
            placeholder="email@exemplo.com"
          />
          <TextField
            id={`${prefixo}-phone`}
            label="Telefone"
            inputMode="numeric"
            value={valor.phone}
            onChange={(e) => onChange({ ...valor, phone: formatPhone(e.target.value) })}
            disabled={disabled}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>
    </div>
  )
}
