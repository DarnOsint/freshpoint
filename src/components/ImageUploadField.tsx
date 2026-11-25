import { useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import { imageUrl } from '../lib/assets'
import { supabase } from '../lib/supabase'

type ImageUploadFieldProps = {
  label: string
  value: string
  onChange: (key: string) => void
  folder: 'products' | 'brand'
  hint?: string
}

export function ImageUploadField({ label, value, onChange, folder, hint }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const preview = imageUrl(value)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const response = await fetch(`/api/uploads?folder=${encodeURIComponent(folder)}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      })
      const result = await response.json() as { key?: string; error?: string }
      if (!response.ok || !result.key) throw new Error(result.error ?? 'Upload failed')
      onChange(result.key)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'We could not upload that image.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="field image-upload">
      <span className="image-upload__label">{label}</span>
      <div className="image-upload__body">
        <div className="image-upload__preview" aria-hidden="true">
          {preview ? <img src={preview} alt="" /> : <ImagePlus size={28} />}
        </div>
        <div className="image-upload__actions">
          <input
            ref={inputRef}
            className="image-upload__input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void handleFile(event)}
            aria-label={label}
          />
          <button
            className="btn btn--outline btn--small"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <LoaderCircle className="spin" size={16} /> : <ImagePlus size={16} />}
            {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
          </button>
          {value ? (
            <button className="btn btn--ghost btn--small" type="button" onClick={() => onChange('')} disabled={uploading}>
              <Trash2 size={15} /> Remove
            </button>
          ) : null}
          <small>{value ? 'Image uploaded.' : hint ?? 'JPEG, PNG or WebP up to 4 MB.'}</small>
        </div>
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}
