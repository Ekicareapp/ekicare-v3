import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { record } = payload;
    const userEmail = record?.email;

    if (!userEmail) {
      return new Response("Missing user email", { status: 400 });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; text-align:center; padding: 20px; background-color: #f9f9f9;">
        <img src="https://ekicare.com/logo-principal.png" alt="Ekicare" width="120" style="margin-bottom: 20px;" />
        <h1 style="color:#1B263B;">Bienvenue sur Ekicare 🐴</h1>
        <p>Merci de nous rejoindre !</p>
        <a href="https://ekicare.com"
           style="display:inline-block; padding:12px 20px; background:#FF5757; color:#fff; text-decoration:none; border-radius:8px; margin-top:20px;">
           Accéder à Ekicare
        </a>
      </div>
    `;

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY is not set");
      return new Response("Email service not configured", { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Ekicare <no-reply@ekicare.com>",
        to: userEmail,
        subject: "Bienvenue sur Ekicare 🎉",
        html
      })
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Erreur lors de l'envoi de l'email :", error);
      return new Response("Erreur lors de l'envoi de l'email", { status: 500 });
    }

    return new Response("Email envoyé avec succès", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Erreur interne", { status: 500 });
  }
});


