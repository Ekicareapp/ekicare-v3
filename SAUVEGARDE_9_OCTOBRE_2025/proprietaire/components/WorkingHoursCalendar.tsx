'use client';

import { useState, useEffect } from 'react';
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
  const [selectedDate, setSelectedDate] = useState(value);

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
    const minDateObj = new Date(minDate);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < minDateObj;
      const isWorkingDay = isDateWorkingDay(workingHours, date);
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
    if (!day.isWorkingDay || day.isPast || !day.isCurrentMonth) return;
    
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
        {days.map((day, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleDateClick(day)}
            disabled={!day.isWorkingDay || day.isPast || !day.isCurrentMonth}
            className={`
              h-10 w-10 text-sm rounded-lg transition-all duration-200 flex items-center justify-center relative
              ${!day.isCurrentMonth 
                ? 'text-neutral-300' 
                : day.isPast 
                  ? 'text-neutral-300 cursor-not-allowed' 
                  : !day.isWorkingDay
                    ? 'text-neutral-300 cursor-not-allowed bg-neutral-50'
                    : 'text-neutral-700 hover:bg-neutral-100 cursor-pointer'
              }
              ${day.isToday ? 'font-semibold' : ''}
              ${day.isSelected ? 'bg-[#ff6b35] text-white hover:bg-[#e55a2b] shadow-sm' : ''}
            `}
          >
            {day.date.getDate()}
            {day.isToday && !day.isSelected && (
              <div className="absolute bottom-1 w-1 h-1 bg-[#ff6b35] rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
