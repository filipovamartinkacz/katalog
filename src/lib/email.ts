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
    subject: 'Tvůj profil byl schválen — žena Blažená',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #8B1D3F;">Tvůj profil byl schválen! 🎉</h2>
        <p>Ahoj ${jmeno},</p>
        <p>
          Tvůj profil na <strong>žena Blažená</strong> byl schválen a je nyní živý v katalogu.
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
        <p style="font-size:12px;color:#999;">žena Blažená — síť prověřených podnikatelek</p>
      </div>
    `,
  })
}
