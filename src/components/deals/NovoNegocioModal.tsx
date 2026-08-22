import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/field'
import { TextField, FormError } from '@/components/auth/AuthShell'
import { createDeal } from '@/data/api'
import { buscarCep, composeAddress } from '@/lib/cep'
import { formatCurrencyInput, parseCurrencyInput, formatCep, cepDigits } from '@/lib/masks'
import type { DealType, DealStage } from '@/data/types'

const TYPES: DealType[] = ['Compra e Venda', 'Locação', 'Permuta']
const STAGES: DealStage[] = ['Coleta de documentos', 'Certidões', 'Revisão', 'Assinatura']

/** Os papéis das partes mudam conforme o tipo de operação. */
const ROLES: Record<DealType, { buyer: string; seller: string }> = {
  'Compra e Venda': { buyer: 'Comprador', seller: 'Vendedor' },
  Locação: { buyer: 'Locatário', seller: 'Locador' },
  Permuta: { buyer: 'Permutante A', seller: 'Permutante B' },
  Auditoria: { buyer: 'Contratante', seller: 'Proprietário' },
}

type CepState = 'idle' | 'buscando' | 'ok' | 'nao-encontrado' | 'erro'

export function NovoNegocioModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (reference: string) => void
}) {
  const [type, setType] = useState<DealType>('Compra e Venda')
  const [stage, setStage] = useState<DealStage>('Coleta de documentos')

  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('')
  const [uf, setUf] = useState('')
  const [cepState, setCepState] = useState<CepState>('idle')

  const [value, setValue] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const numberRef = useRef<HTMLInputElement>(null)
  const roles = ROLES[type]
  const recurring = type === 'Locação'

  // Busca assim que os 8 dígitos estão completos. O AbortController evita que
  // uma consulta antiga, mais lenta, sobrescreva o resultado de uma recente.
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
        // O CEP não traz número: leva o foco direto para lá.
        numberRef.current?.focus()
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setCepState('erro')
      })

    return () => controller.abort()
  }, [cep])

  function reset() {
    setType('Compra e Venda')
    setStage('Coleta de documentos')
    setCep('')
    setStreet('')
    setNumber('')
    setComplement('')
    setDistrict('')
    setCity('')
    setUf('')
    setCepState('idle')
    setValue('')
    setBuyerName('')
    setSellerName('')
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const numeric = parseCurrencyInput(value)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Informe um valor válido.')
      return
    }
    if (!street.trim()) {
      setError('Informe o endereço do imóvel.')
      return
    }

    setSaving(true)
    try {
      const reference = await createDeal({
        type,
        address: composeAddress(street, number, complement),
        cep: cepDigits(cep),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        district: district.trim(),
        city: city.trim(),
        uf: uf.trim(),
        value: numeric,
        recurring,
        stage,
        buyer: { name: buyerName.trim(), role: roles.buyer },
        seller: { name: sellerName.trim(), role: roles.seller },
      })
      reset()
      onCreated(reference)
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
    'nao-encontrado': 'CEP não encontrado. Preencha o endereço manualmente.',
    erro: 'Não foi possível consultar. Preencha manualmente.',
  }[cepState]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo negócio"
      description="O número do negócio é gerado automaticamente."
    >
      <form onSubmit={handleSubmit}>
        <div className="max-h-[62vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="mb-1.5 block text-[13px] font-medium">
                Tipo de operação
              </label>
              <Select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as DealType)}
                disabled={saving}
                className="h-10 w-full"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
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
          </div>

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
                  {cepState === 'buscando' && (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  )}
                  {cepState === 'ok' && <Check className="size-4 text-[#10b981]" />}
                  {(cepState === 'nao-encontrado' || cepState === 'erro') && (
                    <AlertCircle className="size-4 text-[#f59e0b]" />
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-end">
              <p
                className={
                  cepState === 'nao-encontrado' || cepState === 'erro'
                    ? 'pb-2.5 text-[12px] text-[#b45309]'
                    : 'pb-2.5 text-[12px] text-muted-foreground'
                }
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
              placeholder="Vila Mariana"
            />
            <TextField
              id="city"
              label="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={saving}
              placeholder="São Paulo"
            />
            <TextField
              id="uf"
              label="UF"
              maxLength={2}
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase())}
              disabled={saving}
              placeholder="SP"
            />
          </div>

          <div>
            <label htmlFor="value" className="mb-1.5 block text-[13px] font-medium">
              {recurring ? 'Valor do aluguel (mensal)' : 'Valor do negócio'}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-muted-foreground">
                R$
              </span>
              <input
                id="value"
                inputMode="decimal"
                required
                value={value}
                onChange={(e) => setValue(formatCurrencyInput(e.target.value))}
                disabled={saving}
                placeholder={recurring ? '12.500' : '850.000'}
                className="h-10 w-full rounded-lg bg-input-background pl-10 pr-3 text-[14px] tabular-nums outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="buyer"
              label={roles.buyer}
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              disabled={saving}
              placeholder="Nome completo"
            />
            <TextField
              id="seller"
              label={roles.seller}
              required
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              disabled={saving}
              placeholder="Nome completo"
            />
          </div>

          {error && <FormError>{error}</FormError>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" /> Criando...
              </>
            ) : (
              'Criar negócio'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
