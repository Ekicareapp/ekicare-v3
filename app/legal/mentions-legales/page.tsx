import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales | Ekicare',
  description: 'Consultez les mentions légales de Ekicare.',
}

export default function MentionsLegalesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 prose prose-neutral">
      <h1>Mentions légales</h1>
      <div className="whitespace-pre-line text-[15px] leading-7">
Mentions légales

Éditeur du site  
Ce site est édité par : Ekicare  
Statut : Auto-entreprise  
Responsable légal : Tibère Fillie  
Siège social : Paris, France.
SIRET : 94787811200012
Email : support@ekicare.com  

Hébergement  
Le site est hébergé par : Vercel Inc.  
Adresse : 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis  
Site web : https://vercel.com

Propriété intellectuelle  
L’ensemble des éléments de ce site (textes, images, graphismes, logo, structure, code) est protégé par le droit de la propriété intellectuelle.  
Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation préalable, est strictement interdite.

Responsabilité  
Ekicare met tout en œuvre pour offrir aux utilisateurs des informations fiables. Toutefois, aucune responsabilité ne peut être engagée en cas d’erreurs, d’omissions ou de résultats obtenus par un mauvais usage des informations fournies.

Contact  
Pour toute question : support@ekicare.com
      </div>
    </main>
  )
}
