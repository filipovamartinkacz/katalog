import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://katalog-woad.vercel.app'

export async function sendProfilSchvalen({
  to,
  jmeno,
  profilId,
}: {
  to: string
  jmeno: string
  profilId: string
}) {
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Tvůj profil byl schválen — jsem Blažená',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #8B1D3F;">Tvůj profil byl schválen! 🎉</h2>
        <p>Ahoj ${jmeno},</p>
        <p>
          Tvůj profil na <strong>jsem Blažená</strong> byl schválen a je nyní živý v katalogu.
          Zákaznice tě teď mohou najít a kontaktovat.
        </p>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/profil/${profilId}"
             style="background:#8B1D3F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Zobrazit můj profil
          </a>
        </p>
        <p style="margin-top: 32px; font-size: 13px; color: #666;">
          Pokud chceš profil upravit, přihlas se na
          <a href="${APP_URL}/dashboard">${APP_URL}/dashboard</a>.
        </p>
        <hr style="margin-top:32px;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#999;">jsem Blažená — síť prověřených odbornic</p>
      </div>
    `,
  })
}

export async function sendClanekKSchvaleni({
  to,
  autorkaJmeno,
  nadpis,
}: {
  to: string[]
  autorkaJmeno: string
  nadpis: string
}) {
  if (!resend || to.length === 0) return

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Nový článek čeká na schválení — jsem Blažená',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #8B1D3F;">Nový článek čeká na schválení</h2>
        <p>
          <strong>${autorkaJmeno}</strong> odeslala článek <strong>„${nadpis}“</strong>
          ke schválení.
        </p>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/admin/clanky"
             style="background:#8B1D3F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Zobrazit v adminu
          </a>
        </p>
        <hr style="margin-top:32px;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#999;">jsem Blažená — síť prověřených odbornic</p>
      </div>
    `,
  })
}

export async function sendClanekSchvalen({
  to,
  jmeno,
  nadpis,
  slug,
}: {
  to: string
  jmeno: string
  nadpis: string
  slug: string
}) {
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Tvůj článek byl schválen — jsem Blažená',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #8B1D3F;">Tvůj článek byl schválen! 🎉</h2>
        <p>Ahoj ${jmeno},</p>
        <p>
          Tvůj článek <strong>„${nadpis}“</strong> byl schválen a je teď vidět na blogu
          <strong>jsem Blažená</strong>.
        </p>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/blog/${slug}"
             style="background:#8B1D3F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Zobrazit článek
          </a>
        </p>
        <hr style="margin-top:32px;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#999;">jsem Blažená — síť prověřených odbornic</p>
      </div>
    `,
  })
}

export async function sendClanekZamitnut({
  to,
  jmeno,
  nadpis,
  duvod,
}: {
  to: string
  jmeno: string
  nadpis: string
  duvod: string
}) {
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Tvůj článek potřebuje úpravu — jsem Blažená',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #8B1D3F;">Tvůj článek potřebuje ještě úpravu</h2>
        <p>Ahoj ${jmeno},</p>
        <p>
          Tvůj článek <strong>„${nadpis}“</strong> jsme zatím nezveřejnili. Poznámka od
          administrátorky:
        </p>
        <p style="margin:16px 0;padding:12px 16px;background:#f7f2f0;border-left:3px solid #8B1D3F;border-radius:4px;">
          ${duvod}
        </p>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/dashboard/clanky"
             style="background:#8B1D3F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Upravit článek
          </a>
        </p>
        <hr style="margin-top:32px;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#999;">jsem Blažená — síť prověřených odbornic</p>
      </div>
    `,
  })
}

export async function sendNovaPoptavka({
  to,
  jmeno,
  email,
  telefon,
  zprava,
  serviceNazev,
  medailonekId,
}: {
  to: string
  jmeno: string
  email: string
  telefon: string
  zprava: string
  serviceNazev: string | null
  medailonekId: string
}) {
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: email,
    subject: 'Nová poptávka — jsem Blažená',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #8B1D3F;">Nová poptávka</h2>
        <p>Někdo přes tvůj profil na <strong>jsem Blažená</strong> poptává tvoje služby:</p>
        <p style="margin:16px 0;padding:12px 16px;background:#f7f2f0;border-left:3px solid #8B1D3F;border-radius:4px;">
          <strong>Jméno:</strong> ${jmeno}<br />
          <strong>E-mail:</strong> ${email}<br />
          ${telefon ? `<strong>Telefon:</strong> ${telefon}<br />` : ''}
          ${serviceNazev ? `<strong>Má zájem o:</strong> ${serviceNazev}<br />` : ''}
          <strong>Zpráva:</strong><br />${zprava}
        </p>
        <p style="font-size:13px;color:#666;">Můžeš rovnou odpovědět na tento e-mail — přijde jí to přímo.</p>
        <p style="margin-top: 24px;">
          <a href="${APP_URL}/profil/${medailonekId}"
             style="background:#8B1D3F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Zobrazit můj profil
          </a>
        </p>
        <hr style="margin-top:32px;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#999;">jsem Blažená — síť prověřených odbornic</p>
      </div>
    `,
  })
}
