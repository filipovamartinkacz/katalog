'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Props = {
  value: string | null
  onChange: (url: string | null) => void
  userId: string
  fileKey: 'foto' | 'banner'
  aspect: 'avatar' | 'banner'
  label: string
}

const BUCKET = 'profil-fotky'
const MAX_MB = 8

export function ImageUpload({ value, onChange, userId, fileKey, aspect, label }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) { setError('Vyberte obrázek (JPG, PNG, WebP…)'); return }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`Maximální velikost je ${MAX_MB} MB.`); return }

    const path = `${userId}/${fileKey}`

    setUploading(true)
    const supabase = createClient()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) {
      setError('Upload se nezdařil. Zkuste to znovu.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    onChange(`${publicUrl}?t=${Date.now()}`)
    setUploading(false)
  }

  const isAvatar = aspect === 'avatar'

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>

      <div className={isAvatar ? 'flex items-end gap-4' : 'flex flex-col gap-2'}>
        {/* Preview area */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={`relative shrink-0 overflow-hidden bg-muted transition-opacity hover:opacity-90 disabled:cursor-not-allowed ${
            isAvatar ? 'h-20 w-20 rounded-full' : 'h-32 w-full rounded-xl'
          }`}
        >
          {value ? (
            <Image src={value} alt={label} fill className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              {isAvatar ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                  <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
              )}
            </span>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/60">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </span>
          )}
        </button>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/50 disabled:opacity-50"
          >
            {value ? 'Změnit' : 'Nahrát'}
          </button>
          {value && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => onChange(null)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
            >
              Odebrat
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
