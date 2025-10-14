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
      <h1>Bienvenue sur Ekicare !</h1>
      <p>Merci d’avoir rejoint la plateforme. Vous pouvez dès maintenant accéder à votre espace et simplifier votre quotidien équestre.</p>
      <a href="https://ekicare.com" style="color:#FF5757;">Accéder à Ekicare</a>
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


