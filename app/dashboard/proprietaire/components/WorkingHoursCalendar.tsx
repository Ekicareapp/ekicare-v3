'use client';

import { useState } from 'react';
import { WorkingHours, isDateWorkingDay } from '../utils/workingHours';

interface WorkingHoursCalendarProps {
  value: string;
  onChange: (date: string) => void;
  workingHours: WorkingHours | null;
  minDate?: string;
  className?: string;
}

export default function WorkingHoursCalendar({ 
  value, 
  onChange, 
  workingHours, 
  minDate = new Date().toISOString().split('T')[0],
  className = ""
}: WorkingHoursCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [_selectedDate, setSelectedDate] = useState(value);

  // Générer les jours du mois (semaine commence par lundi)
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Calculer le lundi de la première semaine
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajuster pour commencer par lundi
    startDate.setDate(startDate.getDate() + mondayOffset);
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison
    const minDateObj = new Date(minDate);
    minDateObj.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0); // Reset time
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < minDateObj;
      
      // Vérifier si c'est un jour de travail en utilisant getDay() (0=dimanche, 1=lundi, ...)
      let isWorkingDay = false;
      if (workingHours) {
        const dayOfWeekIndex = date.getDay(); // 0=dimanche, 1=lundi, 2=mardi, etc.
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const dayName = dayNames[dayOfWeekIndex];
        const dayHours = workingHours[dayName];
        isWorkingDay = dayHours?.active === true;
        
        // Debug log pour le premier jour du mois uniquement
        if (i === 0 || (isCurrentMonth && date.getDate() === 1)) {
          console.log(`📅 Calendrier - Premier jour: ${dayName} (index ${dayOfWeekIndex}), active: ${dayHours?.active}`);
        }
      }
      
      // Créer la dateString en utilisant les composants locaux pour éviter les décalages de fuseau horaire
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const isSelected = value && dateString === value;
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        isPast,
        isWorkingDay,
        isSelected,
        dateString
      });
    }
    
    return days;
  };

  const handleDateClick = (day: any) => {
    // Empêcher la sélection du jour actuel, des jours passés, des jours non travaillés et des jours hors du mois
    if (!day.isWorkingDay || day.isPast || !day.isCurrentMonth || day.isToday) return;
    
    setSelectedDate(day.dateString);
    onChange(day.dateString);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const days = generateCalendarDays();

  return (
    <div className={`bg-white border border-neutral-200 rounded-xl p-4 ${className}`}>
      {/* Header du calendrier */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-neutral-50 rounded-lg transition-colors group"
        >
          <svg className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-neutral-900">
            {monthNames[currentMonth.getMonth()]}
          </h3>
          <p className="text-sm text-neutral-500">
            {currentMonth.getFullYear()}
          </p>
        </div>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 hover:bg-neutral-50 rounded-lg transition-colors group"
        >
          <svg className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 mb-3" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
        {dayNames.map(day => (
          <div key={day} className="h-10 w-10 flex items-center justify-center text-xs font-medium text-neutral-500">
            {day}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-1" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
        {days.map((day, index) => {
          // Déterminer les classes selon la priorité : sélectionné > aujourd'hui > normal
          const getButtonClasses = () => {
            // Jour sélectionné (priorité max)
            if (day.isSelected) {
              return 'bg-[#ff6b35] text-white hover:bg-[#e55a2b] shadow-sm font-medium';
            }
            
            // Jour non disponible (désactivé, hors mois, passé, aujourd'hui)
            if (!day.isCurrentMonth) {
              return 'text-neutral-300';
            }
            if (day.isPast) {
              return 'text-neutral-300 cursor-not-allowed opacity-50';
            }
            if (!day.isWorkingDay) {
              return 'text-neutral-400 cursor-not-allowed bg-neutral-100 line-through opacity-60';
            }
            
            // Jour actuel DÉSACTIVÉ (règle J+1 minimum) — même style que jours fermés
            if (day.isToday) {
              return 'text-neutral-400 cursor-not-allowed bg-neutral-100 line-through opacity-60';
            }
            
            // Jour normal disponible
            return 'text-neutral-700 hover:bg-neutral-100 cursor-pointer';
          };

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={!day.isWorkingDay || day.isPast || !day.isCurrentMonth || day.isToday}
              className={`
                h-10 w-10 text-sm rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative
                ${getButtonClasses()}
              `}
            >
              <span className={day.isToday ? 'font-medium' : ''}>
                {day.date.getDate()}
              </span>
              {/* Pas d'indication textuelle ou supplémentaire pour J+1 */}
            </button>
          );
        })}
      </div>
    </div>
  );
}
