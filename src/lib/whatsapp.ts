// Normalizace českého telefonního čísla na WhatsApp odkaz. Jen ČR — stejně
// jako zbytek appky řeší geografii výhradně v rámci Česka.
export function toWhatsAppUrl(telefon: string): string | null {
  if (!telefon) return null
  const raw = telefon.replace(/[\s\-().]/g, '')

  let digits: string
  if (raw.startsWith('+420')) digits = raw.slice(4)
  else if (raw.startsWith('00420')) digits = raw.slice(5)
  else if (raw.startsWith('420') && raw.length === 12) digits = raw.slice(3)
  else if (raw.startsWith('+')) return null // jiná země, neumíme
  else if (raw.startsWith('0') && raw.length === 10) digits = raw.slice(1)
  else digits = raw

  if (!/^\d{9}$/.test(digits)) return null

  return `https://wa.me/420${digits}`
}
