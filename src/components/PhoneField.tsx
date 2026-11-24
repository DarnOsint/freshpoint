import { ChevronDown } from 'lucide-react'
import { countries, formatNationalNumber } from '../lib/countries'

type PhoneFieldProps = {
  countryCode: string
  onCountryChange: (code: string) => void
  value: string
  onChange: (value: string) => void
  error?: string
  id?: string
  autoFocus?: boolean
}

export function PhoneField({
  countryCode,
  onCountryChange,
  value,
  onChange,
  error,
  id = 'phone',
  autoFocus,
}: PhoneFieldProps) {
  const country = countries.find((item) => item.code === countryCode) ?? countries[0]

  return (
    <div className={`phone-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>Phone number</label>
      <div className="phone-field__row">
        <div className="phone-field__country">
          <span className="phone-field__flag" aria-hidden="true">{country.flag}</span>
          <select
            aria-label="Country code"
            value={country.code}
            onChange={(event) => onCountryChange(event.target.value)}
          >
            {countries.map((item) => (
              <option key={item.code} value={item.code}>
                {item.flag} {item.name} ({item.dial})
              </option>
            ))}
          </select>
          <span className="phone-field__dial">{country.dial}</span>
          <ChevronDown className="phone-field__chevron" size={15} aria-hidden="true" />
        </div>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          placeholder="900 123 456"
          value={value}
          onChange={(event) => onChange(formatNationalNumber(event.target.value))}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      {error ? <p className="field-error" id={`${id}-error`}>{error}</p> : null}
    </div>
  )
}
