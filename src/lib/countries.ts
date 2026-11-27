export type Country = {
  code: string
  name: string
  dial: string
}

export const countries: Country[] = [
  { code: 'SS', name: 'South Sudan', dial: '+211' },
  { code: 'KE', name: 'Kenya', dial: '+254' },
  { code: 'UG', name: 'Uganda', dial: '+256' },
  { code: 'TZ', name: 'Tanzania', dial: '+255' },
  { code: 'RW', name: 'Rwanda', dial: '+250' },
  { code: 'ET', name: 'Ethiopia', dial: '+251' },
  { code: 'SD', name: 'Sudan', dial: '+249' },
  { code: 'EG', name: 'Egypt', dial: '+20' },
  { code: 'NG', name: 'Nigeria', dial: '+234' },
  { code: 'GH', name: 'Ghana', dial: '+233' },
  { code: 'ZA', name: 'South Africa', dial: '+27' },
  { code: 'CD', name: 'DR Congo', dial: '+243' },
  { code: 'CM', name: 'Cameroon', dial: '+237' },
  { code: 'SN', name: 'Senegal', dial: '+221' },
  { code: 'CI', name: 'Côte d’Ivoire', dial: '+225' },
  { code: 'MA', name: 'Morocco', dial: '+212' },
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'NL', name: 'Netherlands', dial: '+31' },
  { code: 'IT', name: 'Italy', dial: '+39' },
  { code: 'ES', name: 'Spain', dial: '+34' },
  { code: 'PT', name: 'Portugal', dial: '+351' },
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'PK', name: 'Pakistan', dial: '+92' },
  { code: 'BD', name: 'Bangladesh', dial: '+880' },
  { code: 'CN', name: 'China', dial: '+86' },
  { code: 'JP', name: 'Japan', dial: '+81' },
  { code: 'KR', name: 'South Korea', dial: '+82' },
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'NZ', name: 'New Zealand', dial: '+64' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { code: 'QA', name: 'Qatar', dial: '+974' },
  { code: 'TR', name: 'Türkiye', dial: '+90' },
  { code: 'BR', name: 'Brazil', dial: '+55' },
  { code: 'MX', name: 'Mexico', dial: '+52' },
  { code: 'AR', name: 'Argentina', dial: '+54' },
]

export const defaultCountry = countries[0]

/** Build an E.164 phone number from a selected dial code and national number. */
export function toE164(dial: string, national: string): string {
  const digits = national.replace(/\D/g, '').replace(/^0+/, '')
  return `${dial}${digits}`
}

export function isValidNationalNumber(national: string, dial = defaultCountry.dial): boolean {
  const digits = national.replace(/\D/g, '').replace(/^0+/, '')
  const dialDigits = dial.replace(/\D/g, '')
  return digits.length >= 6 && dialDigits.length + digits.length <= 15
}

export function formatNationalNumber(national: string): string {
  const digits = national.replace(/\D/g, '').slice(0, 14)
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ')
}
