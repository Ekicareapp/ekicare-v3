'use client';
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import { useState } from "react";

// Importer la police DM Sans
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  display: 'swap',
});

export default function Home() {
  const [testToast, setTestToast] = useState<null>(null);

  return (
    <div className={`flex flex-col min-h-screen ${dmSans.className}`} style={{ backgroundColor: 'white' }}>
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            La prise de rendez-vous équine,<br />
            <span style={{ color: '#F86F4D' }}>enfin simple.</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Trouvez facilement des professionnels qualifiés pour vos chevaux, 
            gérez vos rendez-vous et développez votre activité équestre en toute simplicité.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="text-white px-6 py-3 text-base font-medium transition-colors hover:opacity-90 border border-[#F86F4D] rounded-sm"
              style={{ backgroundColor: '#F86F4D' }}
            >
              Je suis propriétaire
            </Link>
            <Link
              href="/signup"
              className="bg-white text-gray-700 px-6 py-3 text-base font-medium transition-colors hover:bg-gray-50 border border-gray-200 rounded-sm"
            >
              Je suis professionnel
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white p-4 md:p-6 border border-gray-100 rounded-sm">
              <div className="w-10 h-10 bg-gray-50 rounded-sm flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">Recherche géolocalisée</h3>
              <p className="text-gray-600 text-sm text-center">
                Trouvez des professionnels près de chez vous avec notre système de géolocalisation avancé.
              </p>
            </div>

            <div className="bg-white p-4 md:p-6 border border-gray-100 rounded-sm">
              <div className="w-10 h-10 bg-gray-50 rounded-sm flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">Gestion des rendez-vous</h3>
              <p className="text-gray-600 text-sm text-center">
                Planifiez et gérez facilement vos rendez-vous avec un calendrier intelligent.
              </p>
            </div>

            <div className="bg-white p-4 md:p-6 border border-gray-100 rounded-sm">
              <div className="w-10 h-10 bg-gray-50 rounded-sm flex items-center justify-center mb-4 mx-auto">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">Professionnels vérifiés</h3>
              <p className="text-gray-600 text-sm text-center">
                Tous nos professionnels sont vérifiés et qualifiés pour garantir la qualité des soins.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="p-8 text-white border border-gray-800 rounded-sm" style={{ background: 'linear-gradient(90deg, #1B263B 0%, #415A77 100%)' }}>
            <h2 className="text-2xl font-medium mb-3">Vous êtes professionnel ?</h2>
            <p className="text-base mb-6 opacity-90">
              Réservez une démonstration personnalisée pour découvrir comment Ekicare peut simplifier votre activité au quotidien.
            </p>
            <div className="flex justify-center">
              <a
                href="https://cal.com/ekicare/demo"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-gray-900 px-6 py-3 text-base font-medium transition-colors hover:bg-gray-100 border border-white rounded-sm"
              >
                Réserver une démo
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* FAQ Section - between CTA and Footer */}
      <FAQSection
        items={[
          {
            question: 'Combien coûte l’utilisation d’Ekicare pour les propriétaires ?',
            answer: 'L’utilisation d’Ekicare est gratuite pour les propriétaires. Vous pouvez rechercher des professionnels et prendre rendez-vous sans frais.'
          },
          {
            question: 'Quel est le tarif pour les professionnels ?',
            answer: 'L’abonnement est à 45,95€/mois pour les professionnels, résiliable à tout moment.'
          },
          {
            question: 'Y a-t-il une période d’essai gratuite pour les pros ?',
            answer: 'Oui, tous les professionnels bénéficient automatiquement d’une période d’essai gratuite de 7 jours.'
          },
          {
            question: 'Puis-je résilier mon abonnement à tout moment ?',
            answer: 'Oui, vous pouvez résilier directement depuis votre espace professionnel, sans frais cachés. L’accès reste actif jusqu’à la fin de la période en cours.'
          },
          {
            question: 'Les paiements sont-ils sécurisés ?',
            answer: 'Oui. Ekicare est partenaire officiel de Stripe, l’un des prestataires de paiement les plus fiables et sécurisés au monde.'
          },
          {
            question: 'Est-ce que je peux gérer mes tournées directement depuis Ekicare ?',
            answer: 'Oui, les professionnels peuvent planifier leurs tournées, visualiser leurs créneaux et optimiser leurs déplacements depuis l’interface Ekicare.'
          },
          {
            question: 'Dois-je installer une application ?',
            answer: 'Non, Ekicare fonctionne directement dans votre navigateur, sur ordinateur, tablette et mobile. Aucune installation n’est requise.'
          }
        ]}
      />

      <Footer />
    </div>
  );
}
