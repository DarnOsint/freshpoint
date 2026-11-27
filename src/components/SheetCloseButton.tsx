type SheetCloseButtonProps = {
  label: string
  onClick: () => void
}

export function SheetCloseButton({ label, onClick }: SheetCloseButtonProps) {
  return (
    <button className="sheet-close" type="button" onClick={onClick} aria-label={label}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  )
}
