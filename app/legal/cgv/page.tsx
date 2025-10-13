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
            <h1>Conditions générales de vente</h1>

            <h2>1. Objet</h2>
            <p>Les présentes CGV régissent la vente des services d’abonnement proposés par Ekicare aux professionnels.</p>

            <h2>2. Prestations proposées</h2>
            <p>Ekicare propose un abonnement payant pour permettre aux professionnels d’accéder à l’ensemble des fonctionnalités de la plateforme.</p>

            <h2>3. Prix et paiement</h2>
            <p>Les tarifs sont indiqués en euros, toutes taxes comprises.</p>
            <p>Le paiement s’effectue par carte bancaire via notre prestataire de paiement sécurisé Stripe.</p>

            <h2>4. Droit de rétractation</h2>
            <p>Conformément à la législation, les professionnels ne bénéficient pas du droit de rétractation réservé aux consommateurs.</p>

            <h2>5. Résiliation</h2>
            <p>L’utilisateur peut résilier son abonnement à tout moment via son espace personnel.</p>
            <p>La résiliation prend effet à la fin de la période en cours.</p>

            <h2>6. Responsabilités</h2>
            <p>Ekicare ne peut être tenue responsable des dommages résultant de l’utilisation de la plateforme en dehors des conditions prévues.</p>

            <h2>7. Droit applicable</h2>
            <p>Les présentes CGV sont soumises au droit français.</p>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions générales de vente (CGV) | Ekicare',
  description: 'Conditions générales de vente d\'Ekicare.',
}
