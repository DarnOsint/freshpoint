import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { useSiteSettings } from '../lib/site-content'

const LENGTH = 6

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  id?: string
}

export function OtpInput({ value, onChange, disabled, error, id }: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const copy = useSiteSettings().settings.interface.common

  function setDigit(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = value.padEnd(LENGTH, ' ').slice(0, LENGTH).split('')
    next[index] = digit
    onChange(next.join('').replace(/\s/g, '').slice(0, LENGTH))
    if (digit && index < LENGTH - 1) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !value[index] && index > 0) inputs.current[index - 1]?.focus()
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < LENGTH - 1) inputs.current[index + 1]?.focus()
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    onChange(pasted)
    inputs.current[Math.min(pasted.length, LENGTH - 1)]?.focus()
  }

  return (
    <div className={`otp-input${error ? ' has-error' : ''}`} role="group" aria-label={copy.otpLabel}>
      {Array.from({ length: LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(element) => { inputs.current[index] = element }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={value[index] ?? ''}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          aria-label={`${copy.digitLabel} ${index + 1}`}
        />
      ))}
    </div>
  )
}
