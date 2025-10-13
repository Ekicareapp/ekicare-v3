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
            <h1>Conditions générales d’utilisation</h1>

            <h2>1. Objet</h2>
            <p>Les présentes CGU régissent l’accès et l’utilisation de la plateforme Ekicare par les propriétaires et les professionnels.</p>

            <h2>2. Inscription et compte utilisateur</h2>
            <p>L’utilisateur doit fournir des informations exactes et à jour.</p>
            <p>Ekicare se réserve le droit de suspendre un compte en cas de non-respect des présentes CGU.</p>

            <h2>3. Fonctionnalités</h2>
            <ul>
              <li>Pour les propriétaires : recherche de professionnels, prise de rendez-vous, gestion des chevaux.</li>
              <li>Pour les professionnels : gestion de profil, agenda, tournées, relation client.</li>
            </ul>

            <h2>4. Responsabilités</h2>
            <p>Ekicare met à disposition une plateforme technique mais n’intervient pas dans la relation contractuelle entre propriétaire et professionnel.</p>
            <p>Chaque utilisateur est responsable des informations qu’il fournit.</p>

            <h2>5. Propriété intellectuelle</h2>
            <p>L’ensemble des contenus de la plateforme est protégé. Toute reproduction est interdite.</p>

            <h2>6. Modification des CGU</h2>
            <p>Ekicare se réserve le droit de modifier les CGU. Les utilisateurs seront informés de toute mise à jour.</p>

            <h2>7. Droit applicable</h2>
            <p>Les présentes CGU sont soumises au droit français.</p>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation (CGU) | Ekicare',
  description: 'Conditions générales d\'utilisation du service Ekicare.',
}
