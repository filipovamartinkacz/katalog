// Před nahráním na Supabase Storage převede obrázek na WebP a zmenší ho na
// rozumný maximální rozměr — šetří místo v úložišti i čas načítání stránky.
// Běží čistě v prohlížeči přes <canvas>, žádná nová závislost.

const MAX_DIMENSION = 1920
const WEBP_QUALITY = 0.82

export async function convertImageToWebp(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas není v tomto prohlížeči podporovaný.')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Převod na WebP se nezdařil.'))),
      'image/webp',
      WEBP_QUALITY
    )
  })

  const newName = file.name.replace(/\.[^.]+$/, '') + '.webp'
  return new File([blob], newName, { type: 'image/webp' })
}
