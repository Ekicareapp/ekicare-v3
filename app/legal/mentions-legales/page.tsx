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
            <h1>Mentions légales</h1>

            <h2>Éditeur du site</h2>
            <div className="not-prose mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[15px] leading-7">
              <div>
                <div className="text-gray-500">Éditeur</div>
                <div className="font-medium text-gray-900">Ekicare</div>
              </div>
              <div>
                <div className="text-gray-500">Statut</div>
                <div className="text-gray-800">Auto-entreprise</div>
              </div>
              <div>
                <div className="text-gray-500">Responsable légal</div>
                <div className="text-gray-800">Tibère Fillie</div>
              </div>
              <div>
                <div className="text-gray-500">Siège social</div>
                <div className="text-gray-800">Paris, France</div>
              </div>
              <div>
                <div className="text-gray-500">SIRET</div>
                <div className="text-gray-800">94787811200012</div>
              </div>
              <div>
                <div className="text-gray-500">Email</div>
                <div>
                  <a className="text-gray-800" href="mailto:support@ekicare.com">support@ekicare.com</a>
                </div>
              </div>
            </div>

            <hr className="my-8 border-gray-100" />

            <h2>Hébergement</h2>
            <div className="not-prose mt-4 space-y-1 text-[15px] leading-7 text-gray-800">
              <div>Le site est hébergé par : <span className="font-medium">Vercel Inc.</span></div>
              <div>Adresse : 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</div>
              <div>Site web : <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer">https://vercel.com/</a></div>
            </div>

            <hr className="my-8 border-gray-100" />

            <h2>Propriété intellectuelle</h2>
            <p>
              L’ensemble des éléments de ce site (textes, images, graphismes, logo, structure, code) est protégé par le droit de la propriété intellectuelle.
              Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation préalable, est strictement interdite.
            </p>

            <h2>Responsabilité</h2>
            <p>
              Ekicare met tout en œuvre pour offrir aux utilisateurs des informations fiables. Toutefois, aucune responsabilité ne peut être engagée en cas d’erreurs,
              d’omissions ou de résultats obtenus par un mauvais usage des informations fournies.
            </p>

            <h2>Contact</h2>
            <p>Pour toute question : <a href="mailto:support@ekicare.com">support@ekicare.com</a></p>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}


