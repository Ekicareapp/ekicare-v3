import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation (CGU) | Ekicare',
  description: 'Conditions générales d\'utilisation du service Ekicare.',
}

export default function CguPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 prose prose-neutral">
      <h1>Conditions générales d\'utilisation (CGU)</h1>
      <div className="whitespace-pre-line text-[15px] leading-7">
Conditions générales d’utilisation

1. Objet  
Les présentes CGU régissent l’accès et l’utilisation de la plateforme Ekicare par les propriétaires et les professionnels.

2. Inscription et compte utilisateur  
L’utilisateur doit fournir des informations exactes et à jour.  
Ekicare se réserve le droit de suspendre un compte en cas de non-respect des présentes CGU.

3. Fonctionnalités  
- Pour les propriétaires : recherche de professionnels, prise de rendez-vous, gestion des chevaux.  
- Pour les professionnels : gestion de profil, agenda, tournées, relation client.

4. Responsabilités  
Ekicare met à disposition une plateforme technique mais n’intervient pas dans la relation contractuelle entre propriétaire et professionnel.  
Chaque utilisateur est responsable des informations qu’il fournit.

5. Propriété intellectuelle  
L’ensemble des contenus de la plateforme est protégé. Toute reproduction est interdite.

6. Modification des CGU  
Ekicare se réserve le droit de modifier les CGU. Les utilisateurs seront informés de toute mise à jour.

7. Droit applicable  
Les présentes CGU sont soumises au droit français.
      </div>
    </main>
  )
}
