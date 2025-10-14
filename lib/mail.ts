import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

// Crée une instance Resend uniquement si la clé est disponible
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function sendWelcomeEmail(email: string): Promise<void> {
  if (!resend) {
    console.warn('[mail] RESEND_API_KEY is missing; welcome email not sent')
    return
  }

  try {
    const from = 'Ekicare <no-reply@ekicare.com>'
    const subject = 'Bienvenue sur Ekicare 🐴'
    const html = `
      <div style="background-color:#ffffff;padding:24px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
          <tr>
            <td align="center" style="padding:8px 24px 4px 24px;">
              <img src="https://ekicare.com/logo-principal.png" alt="Ekicare" style="max-width:180px;width:100%;height:auto;display:block;margin:0 auto 16px auto;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 24px 0 24px;">
              <h1 style="margin:0;font-size:24px;line-height:32px;color:#111827;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Bienvenue sur Ekicare !</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 24px 0 24px;">
              <p style="margin:0;color:#374151;font-size:14px;line-height:22px;font-family:Arial,Helvetica,sans-serif;">
                Merci d’avoir rejoint la plateforme. Vous pouvez dès maintenant accéder à votre espace et simplifier votre quotidien équestre.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 24px 24px 24px;">
              <a href="https://ekicare.com" style="background-color:#FF5757;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Accéder à Ekicare</a>
            </td>
          </tr>
        </table>
      </div>
    `

    const { error } = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
    })

    if (error) {
      console.error('[mail] Error sending welcome email:', error)
    }
  } catch (err) {
    console.error('[mail] Unexpected error sending welcome email:', err)
  }
}


