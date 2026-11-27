import { useState } from 'react'
import { imageUrl } from '../lib/assets'

type ProductImageProps = {
  image?: string | null
  emoji?: string
  className?: string
  alt?: string
}

export function ProductImage({ image, className = '', alt = '' }: ProductImageProps) {
  const [failed, setFailed] = useState(false)
  const src = !failed ? imageUrl(image) : ''

  if (src) {
    return (
      <img
        className={`product-image ${className}`.trim()}
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    )
  }
  return <span className={`product-image-placeholder ${className}`.trim()} aria-hidden="true" />
}
