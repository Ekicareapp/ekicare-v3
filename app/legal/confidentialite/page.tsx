import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Ekicare',
  description: 'Politique de confidentialité d\'Ekicare.',
}

export default function ConfidentialitePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 prose prose-neutral">
      <h1>Politique de confidentialité</h1>
      <div className="whitespace-pre-line text-[15px] leading-7">
Politique de confidentialité

Ekicare s'engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.

Données collectées  
Nous collectons uniquement les informations nécessaires à l’utilisation de la plateforme, notamment :
- Nom, prénom
- Adresse e-mail
- Informations de connexion
- Données relatives aux rendez-vous et aux chevaux (propriétaires / professionnels).

Finalités de traitement  
Ces données sont utilisées pour :
- Gérer les comptes utilisateurs
- Assurer la mise en relation propriétaire / professionnel
- Faciliter la prise de rendez-vous
- Améliorer nos services.

Base légale du traitement  
Le traitement repose sur votre consentement et/ou sur l’exécution du service contractuel.

Durée de conservation  
Les données sont conservées aussi longtemps que nécessaire à la fourniture du service et à la conformité légale.

Vos droits  
Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement et d’opposition.  
Vous pouvez exercer ces droits en nous écrivant à : support@ekicare.com

Sécurité  
Nous mettons en œuvre toutes les mesures techniques et organisationnelles nécessaires pour protéger vos données.
      </div>
    </main>
  )
}
