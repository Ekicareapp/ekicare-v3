import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
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
  );
}


