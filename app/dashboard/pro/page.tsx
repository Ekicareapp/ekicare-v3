'use client';

import { useState } from 'react';
import Card from './components/Card';
import Button from './components/Button';
import { Calendar, Clock, Users, Bell, Plus, Eye } from 'lucide-react';

export default function ProDashboardPage() {
  const [notifications] = useState([
    {
      id: '1',
      title: 'Nouveau rendez-vous confirmé',
      message: 'Rendez-vous avec Marie Dubois le 15 janvier à 14h',
      time: 'Il y a 2h',
      type: 'success'
    },
    {
      id: '2',
      title: 'Rendez-vous annulé',
      message: 'Le rendez-vous du 12 janvier a été annulé par le client',
      time: 'Il y a 4h',
      type: 'warning'
    },
    {
      id: '3',
      title: 'Nouveau client',
      message: 'Jean Martin s\'est inscrit sur la plateforme',
      time: 'Il y a 1 jour',
      type: 'info'
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-[#10b981]';
      case 'warning':
        return 'text-[#facc15]';
      case 'error':
        return 'text-[#ef4444]';
      default:
        return 'text-[#3b82f6]';
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card variant="elevated" className="text-center">
          <div className="w-12 h-12 bg-[#f86f4d10] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-[#f86f4d]" />
          </div>
          <h3 className="text-2xl font-bold text-[#111827] mb-1">12</h3>
          <p className="text-[#6b7280]">Rendez-vous cette semaine</p>
        </Card>

        <Card variant="elevated" className="text-center">
          <div className="w-12 h-12 bg-[#f86f4d10] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-[#f86f4d]" />
          </div>
          <h3 className="text-2xl font-bold text-[#111827] mb-1">45</h3>
          <p className="text-[#6b7280]">Clients actifs</p>
        </Card>

        <Card variant="elevated" className="text-center">
          <div className="w-12 h-12 bg-[#f86f4d10] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-[#f86f4d]" />
          </div>
          <h3 className="text-2xl font-bold text-[#111827] mb-1">3</h3>
          <p className="text-[#6b7280]">En attente</p>
        </Card>

        <Card variant="elevated" className="text-center">
          <div className="w-12 h-12 bg-[#f86f4d10] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Bell className="w-6 h-6 text-[#f86f4d]" />
          </div>
          <h3 className="text-2xl font-bold text-[#111827] mb-1">5</h3>
          <p className="text-[#6b7280]">Notifications</p>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Rendez-vous d'aujourd'hui */}
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#111827]">
              Rendez-vous d'aujourd'hui
            </h2>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
              Voir tout
            </Button>
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
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rdv.statut)}`}>
                    {rdv.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Prochains rendez-vous */}
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#111827]">
              Prochains rendez-vous
            </h2>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
              Voir tout
            </Button>
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

      {/* Notifications importantes */}
      <Card variant="elevated">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#111827]">
            Notifications importantes
          </h2>
          <Button variant="ghost" size="sm">
            <Bell className="w-4 h-4" />
            Marquer comme lu
          </Button>
        </div>
        
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div key={notif.id} className="flex items-start space-x-3 p-4 bg-[#f9fafb] rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getNotificationIcon(notif.type)}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-[#111827]">{notif.title}</h3>
                  <span className="text-xs text-[#6b7280]">{notif.time}</span>
                </div>
                <p className="text-sm text-[#6b7280] mt-1">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
