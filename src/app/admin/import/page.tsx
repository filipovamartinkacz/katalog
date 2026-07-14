'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { buttonVariants } from '@/components/ui/button'
import { importMedailonekFromJson, type ImportJson } from '@/app/actions/admin-import'

const EXAMPLE: ImportJson = {
  email: 'jana.novakova@example.cz',
  jmeno: 'Jana',
  prijmeni: 'Nováková',
  display_name: 'Jana Nováková',
  bio: 'Jsem certifikovaná masérka s 10 lety praxe. Specializuji se na relaxační a sportovní masáže. Pracuji individuálně a každou klientku přistupuji s maximální péčí.',
  kontakt_email: 'jana@example.cz',
  telefon: '+420 777 123 456',
  ico: '12345678',
  web: 'https://jana-novakova.cz',
  instagram: 'https://instagram.com/jana_masaze',
  mesta: ['Praha', 'Brno'],
  metody: ['Lymfatická masáž', 'Reiki'],
  sluzby: [
    {
      nazev: 'Relaxační masáž',
      popis: '60minutová celotělová masáž zaměřená na uvolnění napětí.',
      forma: 'osobne',
      cena: '€€',
      kategorie: ['Masáže'],
      klicova_slova: ['relaxace', 'uvolnění', 'stres', 'celotělová masáž'],
    },
    {
      nazev: 'Online konzultace',
      popis: 'Poradenství k domácí péči o tělo a regeneraci.',
      forma: 'online',
      cena: '€',
      kategorie: ['Koučink a osobní rozvoj'],
      klicova_slova: ['regenerace', 'domácí péče'],
    },
  ],
}

type Preview = {
  jmeno: string; prijmeni: string; email: string
  mestoCount: number; metodaCount: number; sluzbaCount: number
}

function parsePreview(raw: string): Preview | null {
  try {
    const d: ImportJson = JSON.parse(raw)
    return {
      jmeno: d.jmeno, prijmeni: d.prijmeni, email: d.email,
      mestoCount: d.mesta?.length ?? 0,
      metodaCount: d.metody?.length ?? 0,
      sluzbaCount: d.sluzby?.length ?? 0,
    }
  } catch { return null }
}

export default function ImportPage() {
  const [json, setJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string; warnings: string[]; medailonekId?: string } | null>(null)

  const preview = parsePreview(json)

  async function handleImport() {
    setLoading(true)
    setResult(null)
    const res = await importMedailonekFromJson(json)
    setResult(res)
    setLoading(false)
    if (res.ok) setJson('')
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Import medailonku z JSON</h1>
        <p className="mt-2 text-lg font-medium text-foreground">
          Vlož JSON sestavený AI asistentem. Systém vytvoří profil a pošle podnikatelce pozvánku na email.
        </p>
      </div>

      {/* Prompt pro AI */}
      <details className="rounded-xl border border-border bg-muted/40 p-4">
        <summary className="cursor-pointer text-sm font-medium">Prompt pro AI asistenta (ChatGPT, Claude…)</summary>
        <div className="mt-3 text-sm text-foreground space-y-2">
          <p>Použij tento prompt na začátku rozhovoru s AI asistentem:</p>
          <pre className="whitespace-pre-wrap rounded-lg bg-background border border-border p-3 text-xs leading-relaxed">{`Budeš sbírat informace o podnikatelce pro katalog služeb a sestavíš strukturovaný JSON profil.

Zeptej se na:
1. Jméno, příjmení a jak ji mají oslovovat zákaznice
2. Email pro vytvoření účtu (přihlašovací) a kontaktní email (veřejný, může být jiný)
3. Bio — příběh, zkušenosti, přístup ke klientkám (alespoň 2-3 věty)
4. Telefon a IČO (nepovinné)
5. Web a sociální sítě (nepovinné) — web, Instagram, Facebook, LinkedIn, TikTok
6. Kde působí — města nebo oblasti
7. Jaké metody využívá ve své práci
8. Jaké konkrétní služby nabízí — pro každou: název, popis, jestli probíhá osobně/online/obojí, přibližná cena (€/€€/€€€/€€€€), kategorie ze seznamu a klíčová slova:
   Kategorie: Kosmetika a péče o pleť, Masáže, Terapie a psychologie, Koučink a osobní rozvoj, Péče v těhotenství a po porodu, Výživa a zdravý životní styl, Pohyb a fyzioterapie, Energie a spiritualita, Poradenství a mentoring, Vzdělávání a kurzy, Ostatní
   Pokud žádná kategorie není vhodná, použij "Ostatní" a upozorni na to provozovatelku katalogu.
   Klíčová slova: 3–8 slov nebo krátkých frází, které zákaznice mohou hledat (např. "úleva od bolesti zad", "relaxace", "burn out").

Na konci sestav JSON přesně v tomto formátu:
{
  "email": "...",
  "jmeno": "...", "prijmeni": "...", "display_name": "...",
  "bio": "...",
  "kontakt_email": "...", "telefon": "...", "ico": "...",
  "web": "...", "instagram": "...", "facebook": "...", "linkedin": "...", "tiktok": "...",
  "mesta": ["..."],
  "metody": ["..."],
  "sluzby": [
    {
      "nazev": "...", "popis": "...", "forma": "osobne|online|oboji",
      "cena": "€|€€|€€€|€€€€", "kategorie": ["..."],
      "klicova_slova": ["...", "..."],
      "booking_url": "..."
    }
  ]
}`}</pre>
        </div>
      </details>

      {/* Příklad */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">JSON</label>
          <button
            type="button"
            onClick={() => setJson(JSON.stringify(EXAMPLE, null, 2))}
            className="text-xs text-primary hover:underline"
          >
            Vložit příklad
          </button>
        </div>
        <Textarea
          rows={18}
          className="font-mono text-xs"
          placeholder={'{\n  "email": "...",\n  "jmeno": "..."\n}'}
          value={json}
          onChange={e => setJson(e.target.value)}
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <p className="font-medium text-foreground mb-2">Náhled</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <span className="text-foreground">Jméno</span>
            <span className="font-medium">{preview.jmeno} {preview.prijmeni}</span>
            <span className="text-foreground">Email</span>
            <span>{preview.email}</span>
            <span className="text-foreground">Města</span>
            <span>{preview.mestoCount}</span>
            <span className="text-foreground">Metody</span>
            <span>{preview.metodaCount}</span>
            <span className="text-foreground">Služby</span>
            <span>{preview.sluzbaCount}</span>
          </div>
        </div>
      )}

      {/* Výsledek */}
      {result && (
        <div className={`rounded-xl border p-4 text-sm ${result.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
          <p className="font-medium">{result.message}</p>
          {result.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-4 space-y-0.5 text-xs opacity-80">
              {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
          {result.ok && result.medailonekId && (
            <Link
              href={`/profil/${result.medailonekId}`}
              className={buttonVariants({ size: 'sm' }) + ' mt-3 inline-flex'}
            >
              Zobrazit náhled medailonku
            </Link>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!preview || loading}
        onClick={handleImport}
        className={buttonVariants({ size: 'lg' }) + ' self-start disabled:opacity-50'}
      >
        {loading ? 'Importuji…' : 'Importovat profil'}
      </button>
    </div>
  )
}
