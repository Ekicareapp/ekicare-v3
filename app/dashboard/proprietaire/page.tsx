'use client';

import Card from './components/Card';
import Button from './components/Button';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Tableau de bord
        </h1>
        <p className="text-gray-600 text-lg">
          Bienvenue sur votre espace propriétaire EkiCare
        </p>
      </div>


      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <Card variant="elevated" hover={false}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Rendez-vous à venir
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center py-4 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#f86f4d] bg-opacity-10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#f86f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Vaccination - Bella</p>
                  <p className="text-sm text-gray-600">Dr. Martin • 15 Jan 2024</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Contrôle dentaire - Thunder</p>
                  <p className="text-sm text-gray-600">Dr. Dubois • 18 Jan 2024</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Mes équidés */}
        <Card variant="elevated" hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Mes équidés</h2>
            <a href="/dashboard/proprietaire/equides">
              <Button variant="ghost" size="sm">
                Voir tout
              </Button>
            </a>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                <div className="w-12 h-12 bg-[#f86f4d] bg-opacity-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#f86f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Bella</h3>
                <p className="text-sm text-gray-600">8 ans • Jument • Pur-sang arabe</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Bai</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Thunder</h3>
                <p className="text-sm text-gray-600">12 ans • Étalon • Quarter Horse</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Noir</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 py-3">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Luna</h3>
                <p className="text-sm text-gray-600">6 ans • Jument • Friesian</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Noir</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
