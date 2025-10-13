import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
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
          <p className="text-gray-400">© 2025 Ekicare. Tous droits réservés.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm text-neutral-400">
            <Link href="/legal/mentions-legales" className="hover:underline hover:text-neutral-300">
              Mentions légales
            </Link>
            <Link href="/legal/confidentialite" className="hover:underline hover:text-neutral-300">
              Confidentialité
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
  );
}


