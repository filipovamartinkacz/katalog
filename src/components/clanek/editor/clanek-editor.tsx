'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { JSONContent } from '@tiptap/core'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TagInput } from '@/components/ui/tag-input'
import { ImageUpload } from '@/components/ui/image-upload'
import { buttonVariants } from '@/components/ui/button'
import { MetodaMultiSelect } from '@/components/clanek/metoda-multi-select'
import { AutorkaPicker } from '@/components/clanek/autorka-picker'
import { TiptapEditor } from './tiptap-editor'
import { createClanekDraft, updateClanekDraft, proposeChangesToPublished, submitClanekForReview, type ClanekInput } from '@/app/actions/clanek'
import { adminUpravitClanek, adminVytvoritClanek, type AdminClanekInput } from '@/app/actions/admin-clanky'

type Kategorie = { id: number; nazev: string }
type Metoda = { id: number; nazev: string; ma_ochrannou_znamku?: boolean }

const EMPTY_OBSAH: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] }

// <input type="datetime-local"> očekává a zobrazuje čas jako lokální — ISO string z DB
// je ale v UTC, takže ho pro zobrazení musíme posunout o časovou zónu prohlížeče.
function toLocalDatetimeInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

const TYPY = [
  { value: 'blog', label: 'Blogový článek' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'video', label: 'Video' },
] as const

const STATUSY = [
  { value: 'rozpracovano', label: 'Rozpracováno' },
  { value: 'ceka_na_schvaleni', label: 'Čeká na schválení' },
  { value: 'publikovano', label: 'Publikováno' },
  { value: 'zamitnuto', label: 'Zamítnuto' },
] as const

export type ClanekEditorInitial = {
  id: string
  typ: 'blog' | 'podcast' | 'video'
  kategorie_id: number | null
  nadpis: string
  obsah: JSONContent
  cover_url: string | null
  cover_alt: string
  zdroj_url: string
  je_gated: boolean
  seo_title: string
  seo_description: string
  metoda_ids: number[]
  klicova_slova: string[]
  status: 'rozpracovano' | 'ceka_na_schvaleni' | 'publikovano' | 'zamitnuto'
  slug: string
  published_at: string | null
  zamitnuti_duvod?: string | null
}

type Props = {
  mode: 'create' | 'edit'
  userId: string
  kategorie: Kategorie[]
  metody: Metoda[]
  initial?: ClanekEditorInitial
  isAdminMode?: boolean
  readOnly?: boolean
}

export function ClanekEditor({
  mode, userId, kategorie, metody, initial, isAdminMode = false, readOnly = false,
}: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [autorkaId, setAutorkaId] = useState<string>('')

  const [typ, setTyp] = useState<'blog' | 'podcast' | 'video'>(initial?.typ ?? 'blog')
  const [kategorieId, setKategorieId] = useState<number | null>(initial?.kategorie_id ?? kategorie[0]?.id ?? null)
  const [nadpis, setNadpis] = useState(initial?.nadpis ?? '')
  const [obsah, setObsah] = useState<JSONContent>(initial?.obsah ?? EMPTY_OBSAH)
  // Stabilní klíč pro úložiště coveru — u editace ID článku, u nového článku
  // náhodné UUID (jinak by druhý článek stejné autorky přepsal cover prvního,
  // protože ImageUpload ukládá pod stejný fileKey pořád na stejnou cestu).
  const [coverKey] = useState(() => initial?.id ?? crypto.randomUUID())
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.cover_url ?? null)
  const [coverAlt, setCoverAlt] = useState(initial?.cover_alt ?? '')
  const [zdrojUrl, setZdrojUrl] = useState(initial?.zdroj_url ?? '')
  const [jeGated, setJeGated] = useState(initial?.je_gated ?? false)
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(initial?.seo_description ?? '')
  const [metodaIds, setMetodaIds] = useState<number[]>(initial?.metoda_ids ?? [])
  const [klicovaSlova, setKlicovaSlova] = useState<string[]>(initial?.klicova_slova ?? [])

  // Admin-only pole
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'rozpracovano')
  // Bez existujícího data publikace nabídneme jako výchozí aktuální okamžik (načtení stránky).
  const [publishedAt, setPublishedAt] = useState<string | null>(initial?.published_at ?? new Date().toISOString())
  const [zamitnutiDuvod, setZamitnutiDuvod] = useState(initial?.zamitnuti_duvod ?? '')

  if (readOnly) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
          Článek čeká na schválení a nedá se teď upravovat. Jakmile ho admin posoudí, budeš
          moct pokračovat v editaci (nebo ho podle poznámky opravit, pokud bude zamítnut).
        </div>
        <div className="flex gap-4">
          {initial?.slug && (
            <Link href={`/blog/${initial.slug}`} className="text-sm font-medium text-primary hover:underline">
              Zobrazit náhled článku →
            </Link>
          )}
          <Link href="/dashboard/clanky" className="text-sm text-muted-foreground hover:text-foreground">
            ← Zpět na moje články
          </Link>
        </div>
      </div>
    )
  }

  function canSubmit() {
    return nadpis.trim().length > 0 && kategorieId !== null && coverUrl && coverAlt.trim().length > 0
  }

  async function handleSave() {
    if (!canSubmit()) { setError('Vyplň nadpis, kategorii a cover obrázek s alt textem.'); return }
    if (isAdminMode && status === 'zamitnuto' && !zamitnutiDuvod.trim()) {
      setError('Napiš prosím důvod zamítnutí.')
      return
    }
    setSaving(true)
    setError(null)
    setSaved(false)

    if (isAdminMode && mode === 'create') {
      if (!autorkaId) { setError('Vyber autorku.'); setSaving(false); return }
      const data: AdminClanekInput & { medailonek_id: string } = {
        typ, kategorie_id: kategorieId!, nadpis, slug: '', obsah,
        cover_url: coverUrl!, cover_alt: coverAlt, zdroj_url: zdrojUrl,
        je_gated: jeGated, seo_title: seoTitle, seo_description: seoDescription,
        status, published_at: publishedAt, zamitnuti_duvod: status === 'zamitnuto' ? zamitnutiDuvod.trim() : null,
        metoda_ids: metodaIds, klicova_slova: klicovaSlova,
        medailonek_id: autorkaId,
      }
      const result = await adminVytvoritClanek(data)
      if (result?.error) { setError(result.error); setSaving(false) }
      return
    }

    if (isAdminMode && initial) {
      const data: AdminClanekInput = {
        typ, kategorie_id: kategorieId!, nadpis, slug, obsah,
        cover_url: coverUrl!, cover_alt: coverAlt, zdroj_url: zdrojUrl,
        je_gated: jeGated, seo_title: seoTitle, seo_description: seoDescription,
        status, published_at: publishedAt, zamitnuti_duvod: status === 'zamitnuto' ? zamitnutiDuvod.trim() : null,
        metoda_ids: metodaIds, klicova_slova: klicovaSlova,
      }
      const result = await adminUpravitClanek(initial.id, data)
      if (result?.error) { setError(result.error); setSaving(false); return }
      setSaved(true)
      setSaving(false)
      router.refresh()
      return
    }

    const data: ClanekInput = {
      typ, kategorie_id: kategorieId!, nadpis, obsah,
      cover_url: coverUrl!, cover_alt: coverAlt, zdroj_url: zdrojUrl,
      je_gated: jeGated, seo_title: seoTitle, seo_description: seoDescription,
      metoda_ids: metodaIds, klicova_slova: klicovaSlova,
    }

    if (mode === 'create') {
      const result = await createClanekDraft(data)
      if (result?.error) { setError(result.error); setSaving(false) }
      return
    }

    const result = initial?.status === 'publikovano'
      ? await proposeChangesToPublished(initial.id, data)
      : await updateClanekDraft(initial!.id, data)

    if (result?.error) { setError(result.error); setSaving(false); return }
    setSaved(true)
    setSaving(false)
    router.refresh()
  }

  async function handleSubmitForReview() {
    if (!initial) return
    if (!canSubmit()) { setError('Vyplň nadpis, kategorii a cover obrázek s alt textem.'); return }
    setSaving(true)
    setError(null)
    // Nejdřív ulož rozpracované změny, pak teprve odešli ke schválení.
    const data: ClanekInput = {
      typ, kategorie_id: kategorieId!, nadpis, obsah,
      cover_url: coverUrl!, cover_alt: coverAlt, zdroj_url: zdrojUrl,
      je_gated: jeGated, seo_title: seoTitle, seo_description: seoDescription,
      metoda_ids: metodaIds, klicova_slova: klicovaSlova,
    }
    const saveResult = await updateClanekDraft(initial.id, data)
    if (saveResult?.error) { setError(saveResult.error); setSaving(false); return }
    const result = await submitClanekForReview(initial.id)
    if (result?.error) { setError(result.error); setSaving(false) }
  }

  const canPropose = mode === 'edit' && !isAdminMode && (initial?.status === 'rozpracovano' || initial?.status === 'zamitnuto')

  return (
    <div className="flex flex-col gap-6">
      {initial?.status === 'zamitnuto' && initial.zamitnuti_duvod && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Poznámka od admina:</strong> {initial.zamitnuti_duvod}
        </div>
      )}

      {isAdminMode && mode === 'create' && (
        <div className="flex flex-col gap-1.5">
          <Label>Autorka *</Label>
          <AutorkaPicker value={autorkaId} onChange={setAutorkaId} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Typ článku</Label>
        <div className="flex gap-2">
          {TYPY.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTyp(t.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                typ === t.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nadpis">Nadpis *</Label>
        <Input id="nadpis" value={nadpis} onChange={e => setNadpis(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Kategorie *</Label>
        <select
          value={kategorieId ?? ''}
          onChange={e => setKategorieId(Number(e.target.value))}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {kategorie.map(k => (
            <option key={k.id} value={k.id}>{k.nazev}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5">
        <ImageUpload
          value={coverUrl}
          onChange={setCoverUrl}
          userId={userId}
          bucket="clanek-obrazky"
          fileKey={`cover-${coverKey}`}
          aspect="banner"
          label="Cover obrázek *"
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cover_alt">Alt text cover obrázku *</Label>
          <Input id="cover_alt" value={coverAlt} onChange={e => setCoverAlt(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Obsah *</Label>
        <TiptapEditor value={obsah} onChange={setObsah} userId={userId} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="zdroj_url">Zdroj <span className="text-muted-foreground">(nepovinné — např. pokud článek vyšel i na tvém vlastním blogu)</span></Label>
        <Input id="zdroj_url" type="url" placeholder="https://" value={zdrojUrl} onChange={e => setZdrojUrl(e.target.value)} />
      </div>

      {isAdminMode && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={jeGated} onChange={e => setJeGated(e.target.checked)} />
          Část článku jen pro přihlášené
        </label>
      )}

      <div className="flex flex-col gap-3">
        <Label>Metody <span className="text-muted-foreground text-sm">(nepovinné)</span></Label>
        <MetodaMultiSelect metody={metody} value={metodaIds} onChange={setMetodaIds} />
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">SEO</h3>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="seo_title">Meta titulek <span className="text-muted-foreground">(nepovinný)</span></Label>
          <Input id="seo_title" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="seo_description">Meta popis <span className="text-muted-foreground">(nepovinný)</span></Label>
          <Textarea id="seo_description" rows={2} value={seoDescription} onChange={e => setSeoDescription(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Klíčová slova <span className="text-muted-foreground text-xs">(nepovinná)</span></Label>
          <TagInput value={klicovaSlova} onChange={setKlicovaSlova} />
        </div>
      </div>

      {isAdminMode && (
        <div className="flex flex-col gap-4 border-t border-border pt-5">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Admin</h3>
          {mode === 'edit' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">URL</Label>
              <Input id="slug" value={slug} onChange={e => setSlug(e.target.value)} />
              <p className="text-xs text-amber-700">Změna URL u publikovaného článku ovlivní SEO a existující odkazy zvenčí.</p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Stav</Label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as typeof status)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {STATUSY.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          {status === 'zamitnuto' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zamitnuti_duvod">Důvod zamítnutí *</Label>
              <Textarea
                id="zamitnuti_duvod"
                rows={3}
                placeholder="Co má autorka opravit… (uvidí to v e-mailu)"
                value={zamitnutiDuvod}
                onChange={e => setZamitnutiDuvod(e.target.value)}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="published_at">Datum publikace</Label>
            <Input
              id="published_at"
              type="datetime-local"
              value={toLocalDatetimeInputValue(publishedAt)}
              onChange={e => setPublishedAt(e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </div>
        </div>
      )}

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {saved && !error && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Uloženo.</p>}

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
        <button type="button" disabled={saving} onClick={handleSave} className={buttonVariants({ variant: 'outline' }) + ' disabled:opacity-50'}>
          {saving ? 'Ukládám…' : mode === 'create' && !isAdminMode ? 'Uložit jako rozpracované' : 'Uložit'}
        </button>
        {canPropose && (
          <button type="button" disabled={saving} onClick={handleSubmitForReview} className={buttonVariants() + ' disabled:opacity-50'}>
            Odeslat ke schválení
          </button>
        )}
      </div>
    </div>
  )
}
