'use client';

import { useState } from 'react';
import Card from './components/Card';
import Button from './components/Button';
import { Calendar, Clock, Users, Bell, Plus, Eye } from 'lucide-react';

export default function ProDashboardPage() {
  const [prochainesTournees] = useState([
    {
      id: '1',
      titre: 'Tournée secteur Nord',
      date: '20 janvier 2024',
      nombreClients: 8,
      statut: 'planifiée'
    },
    {
      id: '2',
      titre: 'Tournée secteur Sud',
      date: '25 janvier 2024',
      nombreClients: 5,
      statut: 'planifiée'
    },
    {
      id: '3',
      titre: 'Tournée secteur Est',
      date: '30 janvier 2024',
      nombreClients: 12,
      statut: 'planifiée'
    }
  ]);

  const [rendezVousAujourdhui] = useState([
    {
      id: '1',
      client: 'Marie Dubois',
      equide: 'Bella',
      heure: '09:00',
      type: 'Consultation',
      statut: 'confirmé'
    },
    {
      id: '2',
      client: 'Pierre Martin',
      equide: 'Thunder',
      heure: '11:30',
      type: 'Vaccination',
      statut: 'confirmé'
    },
    {
      id: '3',
      client: 'Sophie Laurent',
      equide: 'Luna',
      heure: '14:00',
      type: 'Contrôle',
      statut: 'en-attente'
    }
  ]);

  const [prochainsRendezVous] = useState([
    {
      id: '1',
      client: 'Jean Dupont',
      equide: 'Storm',
      date: '16 janvier',
      heure: '10:00',
      type: 'Chirurgie',
      statut: 'confirmé'
    },
    {
      id: '2',
      client: 'Claire Moreau',
      equide: 'Spirit',
      date: '18 janvier',
      heure: '15:30',
      type: 'Consultation',
      statut: 'en-attente'
    }
  ]);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'confirmé':
        return 'text-[#10b981] bg-[#d1fae5]';
      case 'en-attente':
        return 'text-[#facc15] bg-[#fef3c7]';
      case 'annulé':
        return 'text-[#ef4444] bg-[#fee2e2]';
      default:
        return 'text-[#6b7280] bg-[#f3f4f6]';
    }
  };

  const getTourneeIcon = (statut: string) => {
    switch (statut) {
      case 'planifiée':
        return 'text-[#3b82f6]';
      case 'en-cours':
        return 'text-[#facc15]';
      case 'terminée':
        return 'text-[#10b981]';
      default:
        return 'text-[#6b7280]';
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827] mb-2">
          Tableau de bord
        </h1>
        <p className="text-[#6b7280] text-lg">
          Vue d'ensemble de votre activité professionnelle
        </p>
      </div>


      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Rendez-vous d'aujourd'hui */}
        <Card variant="elevated">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#111827]">
              Rendez-vous d'aujourd'hui
            </h2>
          </div>
          
          <div className="space-y-3">
            {rendezVousAujourdhui.map((rdv) => (
              <div key={rdv.id} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f86f4d10] rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#f86f4d]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#111827]">{rdv.client}</p>
                    <p className="text-sm text-[#6b7280]">{rdv.equide} • {rdv.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#111827]">{rdv.heure}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Prochains rendez-vous */}
        <Card variant="elevated">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#111827]">
              Prochains rendez-vous
            </h2>
          </div>
          
          <div className="space-y-3">
            {prochainsRendezVous.map((rdv) => (
              <div key={rdv.id} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f86f4d10] rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#f86f4d]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#111827]">{rdv.client}</p>
                    <p className="text-sm text-[#6b7280]">{rdv.equide} • {rdv.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#111827]">{rdv.date}</p>
                  <p className="text-sm text-[#6b7280]">{rdv.heure}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Prochaines tournées */}
      <Card variant="elevated">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#111827]">
            Prochaines tournées
          </h2>
        </div>
        
        <div className="space-y-3">
          {prochainesTournees.length > 0 ? (
            prochainesTournees.map((tournee) => (
              <div key={tournee.id} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f86f4d10] rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#f86f4d]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#111827]">{tournee.titre}</p>
                    <p className="text-sm text-[#6b7280]">{tournee.nombreClients} clients</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#111827]">{tournee.date}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-[#6b7280]">Aucune tournée prévue</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
