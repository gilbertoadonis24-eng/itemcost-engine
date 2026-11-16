import type { ReactNode } from 'react'

export function Num({
  label,
  value,
  onChange,
  step = '0.01',
  max = 1_000_000_000,
  wide = false,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step?: string
  max?: number
  wide?: boolean
  hint?: string
}) {
  return (
    <label className={wide ? 'field wide' : 'field'}>
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => {
          const next = event.target.value
          if (next === '') {
            onChange(0)
            return
          }
          const parsed = Number(next)
          if (!Number.isFinite(parsed) || parsed < 0) return
          onChange(Math.min(max, parsed))
        }}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function TextField({
  label,
  value,
  onChange,
  maxLength = 160,
  wide = false,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  wide?: boolean
  hint?: string
}) {
  return (
    <label className={wide ? 'field wide' : 'field'}>
      <span>{label}</span>
      <input
        type="text"
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  children,
  wide = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <label className={wide ? 'field wide' : 'field'}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  )
}
