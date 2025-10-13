import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-flex items-center gap-1">
          ← Retour à l’accueil
        </Link>
        <div className="bg-white border border-gray-100 rounded-sm shadow-sm p-6 md:p-8">
          <article className="prose prose-neutral max-w-none prose-headings:font-semibold prose-h1:tracking-tight prose-h1:text-3xl md:prose-h1:text-4xl prose-h2:mt-8 md:prose-h2:mt-10 prose-h2:text-xl md:prose-h2:text-2xl prose-p:text-[15px] prose-p:leading-7 prose-a:no-underline hover:prose-a:underline underline-offset-2">
            <h1>Politique de confidentialité</h1>

            <p>
              Ekicare s'engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
            </p>

            <h2>Données collectées</h2>
            <p>Nous collectons uniquement les informations nécessaires à l’utilisation de la plateforme, notamment :</p>
            <ul>
              <li>Nom, prénom</li>
              <li>Adresse e-mail</li>
              <li>Informations de connexion</li>
              <li>Données relatives aux rendez-vous et aux chevaux (propriétaires / professionnels).</li>
            </ul>

            <h2>Finalités de traitement</h2>
            <p>Ces données sont utilisées pour :</p>
            <ul>
              <li>Gérer les comptes utilisateurs</li>
              <li>Assurer la mise en relation propriétaire / professionnel</li>
              <li>Faciliter la prise de rendez-vous</li>
              <li>Améliorer nos services.</li>
            </ul>

            <h2>Base légale du traitement</h2>
            <p>Le traitement repose sur votre consentement et/ou sur l’exécution du service contractuel.</p>

            <h2>Durée de conservation</h2>
            <p>Les données sont conservées aussi longtemps que nécessaire à la fourniture du service et à la conformité légale.</p>

            <h2>Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement et d’opposition.
            </p>
            <p>
              Vous pouvez exercer ces droits en nous écrivant à : <a href="mailto:support@ekicare.com">support@ekicare.com</a>
            </p>

            <h2>Sécurité</h2>
            <p>Nous mettons en œuvre toutes les mesures techniques et organisationnelles nécessaires pour protéger vos données.</p>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Ekicare',
  description: 'Politique de confidentialité d\'Ekicare.',
}
