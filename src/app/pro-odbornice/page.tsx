import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function ProOdbornicePage() {
  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section
        className="relative overflow-hidden -mt-16 pt-40 pb-24 px-4 sm:pt-52 sm:pb-36 sm:px-6"
        style={{ background: 'radial-gradient(circle at 5% 0%, oklch(0.91 0.038 14) 0%, oklch(0.988 0.006 75) 48%)' }}
      >
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full"
          style={{ background: 'oklch(0.68 0.07 188)', opacity: 0.10 }}
        />
        <svg
          className="pointer-events-none absolute bottom-0 right-0 h-36 w-28 -scale-x-100"
          viewBox="0 0 180 210"
          fill="none"
          aria-hidden="true"
          stroke="oklch(0.50 0.08 188)"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.28 }}
        >
          <path strokeWidth="1.8" d="M 38,208 C 42,175 47,145 54,114 C 61,83 66,53 74,16" />
          <path strokeWidth="1.6" d="M 52,117 C 26,104 9,83 16,61 C 33,70 50,92 52,117 Z" />
          <path strokeWidth="1" d="M 52,117 L 16,61" />
          <path strokeWidth="1.6" d="M 56,111 C 80,98 93,77 86,55 C 69,64 55,86 56,111 Z" />
          <path strokeWidth="1" d="M 56,111 L 86,55" />
          <path strokeWidth="1.6" d="M 59,77 C 36,64 23,44 30,23 C 47,32 60,54 59,77 Z" />
          <path strokeWidth="1" d="M 59,77 L 30,23" />
          <path strokeWidth="1.6" d="M 64,71 C 87,58 99,38 92,17 C 75,26 62,49 64,71 Z" />
          <path strokeWidth="1" d="M 64,71 L 92,17" />
          <path strokeWidth="1.6" d="M 68,40 C 48,30 38,14 44,2 C 58,8 69,26 68,40 Z" />
          <path strokeWidth="1" d="M 68,40 L 44,2" />
          <path strokeWidth="1.6" d="M 72,35 C 91,25 99,10 93,0 C 78,6 71,22 72,35 Z" />
          <path strokeWidth="1" d="M 72,35 L 93,0" />
        </svg>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-background" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-foreground">
            Zdarma · Bez závazků
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Představ se ženám,<br />které tě hledají
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg font-medium text-foreground">
            Vytvoř si profil v katalogu jsem Blažená a oslovuj zákaznice,
            které aktivně hledají právě to, co nabízíš.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/registrace" className={buttonVariants({ size: 'lg' })}>
              Vytvořit profil zdarma
            </Link>
            <Link href="/katalog" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Prohlédnout katalog
            </Link>
          </div>
        </div>
      </section>

      {/* Benefity */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Co ti katalog přinese
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-border bg-card p-7">
                <div className="text-3xl">{b.emoji}</div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jak to funguje */}
      <section className="bg-muted/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Jak začít
          </h2>
          <ol className="mt-12 flex flex-col gap-6">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold text-primary-foreground sm:text-3xl">
            Připravena začít?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Registrace je zdarma a profil máš hotový za pár minut.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/registrace"
              className={buttonVariants({ variant: 'secondary', size: 'lg' }) + ' bg-primary-foreground text-primary hover:bg-primary-foreground/90'}
            >
              Zaregistrovat se zdarma
            </Link>
            <Link
              href="/prihlaseni"
              className="text-sm font-medium text-primary-foreground/70 underline-offset-4 hover:text-primary-foreground hover:underline"
            >
              Už mám účet
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

const BENEFITS = [
  {
    emoji: '🔍',
    title: 'Zákaznice tě najdou',
    desc: 'Hledající ženy filtrují katalog podle kategorií, metod i lokality. Tvůj profil se zobrazí přesně těm, které hledají to, co nabízíš.',
  },
  {
    emoji: '✨',
    title: 'Profesionální medailonek',
    desc: 'Vlož fotku, bio, seznam služeb a metody, které používáš. Profil slouží jako tvá vizitka dostupná 24/7.',
  },
  {
    emoji: '🌿',
    title: 'Komunita ověřených odbornic',
    desc: 'Každý profil prochází schválením. Zákaznice vědí, že katalog sdružuje skutečné a prověřené odbornice.',
  },
  {
    emoji: '📍',
    title: 'Lokalita i online',
    desc: 'Pracuješ osobně, online, nebo obojí? Nastav si lokalitu a oslovuj ženy ve svém okolí i po celé ČR.',
  },
  {
    emoji: '💬',
    title: 'Přímý kontakt',
    desc: 'Na profilu zobrazíš e-mail, telefon i odkaz na rezervaci. Zákaznice se ti ozvou přímo — bez prostředníků.',
  },
  {
    emoji: '🎁',
    title: 'Zdarma',
    desc: 'Základní profil je a zůstane zdarma. Chceme podpořit odbornice, ne je zatěžovat dalšími poplatky.',
  },
]

const STEPS = [
  {
    title: 'Zaregistruj se',
    desc: 'Stačí e-mail a heslo. Registrace trvá minutu.',
  },
  {
    title: 'Vytvoř si medailonek',
    desc: 'Vyplň základní info: jméno, bio, služby, metody a lokalitu. Průvodce tě provede krok po kroku.',
  },
  {
    title: 'Počkej na schválení',
    desc: 'Profil zkontrolujeme a do 48 hodin ti dáme vědět. Chceme mít jistotu, že katalog je kvalitní pro obě strany.',
  },
  {
    title: 'Oslovuj zákaznice',
    desc: 'Schválený profil se zobrazí v katalogu. Zákaznice tě najdou a ozvou se ti přímo.',
  },
]
