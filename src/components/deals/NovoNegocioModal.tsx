import { useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/field'
import { TextField, FormError } from '@/components/auth/AuthShell'
import { createDeal } from '@/data/api'
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
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('São Paulo, SP')
  const [value, setValue] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const roles = ROLES[type]
  const recurring = type === 'Locação'

  function reset() {
    setType('Compra e Venda')
    setStage('Coleta de documentos')
    setAddress('')
    setDistrict('')
    setCity('São Paulo, SP')
    setValue('')
    setBuyerName('')
    setSellerName('')
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    // Aceita "850.000,00" e "850000" — o corretor digita como preferir.
    const numeric = Number(value.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Informe um valor válido.')
      return
    }

    setSaving(true)
    try {
      const reference = await createDeal({
        type,
        address: address.trim(),
        district: district.trim(),
        city: city.trim(),
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo negócio"
      description="O número do negócio é gerado automaticamente."
    >
      <form onSubmit={handleSubmit}>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
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

          <TextField
            id="address"
            label="Endereço do imóvel"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={saving}
            placeholder="Rua Vergueiro, 1200 – Apto 302"
          />

          <div className="grid grid-cols-2 gap-4">
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
              label="Cidade / UF"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={saving}
            />
          </div>

          <TextField
            id="value"
            label={recurring ? 'Valor do aluguel (mensal)' : 'Valor do negócio'}
            required
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={saving}
            placeholder={recurring ? '12.500' : '850.000'}
            hint="Em reais, sem o R$."
          />

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
