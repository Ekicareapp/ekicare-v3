import Image from "next/image";
import Link from "next/link";

// Importer la police DM Sans
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  display: 'swap',
});

export default function Home() {
  return (
    <div className={`min-h-screen ${dmSans.className}`} style={{ backgroundColor: 'white' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
        <Image
                src="/logo-ekicare.png"
                alt="Ekicare"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <div className="flex space-x-4">
              <Link
                href="/login"
                className="text-gray-700 px-4 py-2 text-sm font-medium transition-colors hover:text-[#F86F4D]"
              >
                Se connecter
              </Link>
              <Link
                href="/signup"
                className="text-white px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 border border-[#F86F4D] rounded-sm"
                style={{ backgroundColor: '#F86F4D' }}
              >
                S'inscrire
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
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
            <h2 className="text-2xl font-medium mb-3">Prêt à commencer ?</h2>
            <p className="text-base mb-6 opacity-90">
              Rejoignez la communauté Ekicare et transformez votre expérience équestre.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="bg-white text-gray-900 px-6 py-3 text-base font-medium transition-colors hover:bg-gray-100 border border-white rounded-sm"
              >
                Créer mon compte
              </Link>
              <Link
                href="/login"
                className="border border-white text-white px-6 py-3 text-base font-medium transition-colors hover:bg-white hover:text-gray-900 rounded-sm"
              >
                J'ai déjà un compte
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Image
              src="/logo-ekicare.png"
              alt="Ekicare"
              width={120}
              height={40}
              className="h-10 w-auto mx-auto mb-4 brightness-0 invert"
            />
            <p className="text-gray-400">
              © 2025 Ekicare. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm text-neutral-400">
              <Link href="/legal/mentions-legales" className="hover:underline hover:text-neutral-300">
                Mentions légales
              </Link>
              <Link href="/legal/confidentialite" className="hover:underline hover:text-neutral-300">
                Confidentialité
              </Link>
              <Link href="/legal/cookies" className="hover:underline hover:text-neutral-300">
                Cookies
              </Link>
              <Link href="/legal/cgu" className="hover:underline hover:text-neutral-300">
                CGU
              </Link>
              <Link href="/legal/cgv" className="hover:underline hover:text-neutral-300">
                CGV
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
