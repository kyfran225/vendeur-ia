import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Check, Sparkles } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DateTimePickerProps {
  value: string; // ISO string or format YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  minDate?: Date;
}

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const DAYS_SHORT_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const QUICK_HOURS = [
  { label: "09:00", hour: 9, minute: 0, tag: "Matin" },
  { label: "12:30", hour: 12, minute: 30, tag: "Midi" },
  { label: "15:00", hour: 15, minute: 0, tag: "Après-midi" },
  { label: "18:30", hour: 18, minute: 30, tag: "Soirée" },
  { label: "20:00", hour: 20, minute: 0, tag: "Nuit" },
];

export function DateTimePicker({ value, onChange, minDate = new Date() }: DateTimePickerProps) {
  const initialDate = value ? new Date(value) : new Date(Date.now() + 3600 * 1000);
  
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedHour, setSelectedHour] = useState<number>(initialDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(initialDate.getMinutes() >= 30 ? 30 : 0);

  // Synchronise whenever internal state changes
  const updateDateTime = (dayDate: Date, hour: number, minute: number) => {
    const next = new Date(dayDate);
    next.setHours(hour, minute, 0, 0);
    setSelectedDate(next);
    setSelectedHour(hour);
    setSelectedMinute(minute);

    const localIso = new Date(next.getTime() - next.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    onChange(localIso);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Calendar matrix calculation
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const startDayOffset = getFirstDayOfMonth(currentYear, currentMonth);

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isPastDay = (dayNumber: number) => {
    const dayDate = new Date(currentYear, currentMonth, dayNumber, 23, 59, 59);
    const startOfToday = new Date(minDate);
    startOfToday.setHours(0, 0, 0, 0);
    return dayDate.getTime() < startOfToday.getTime();
  };

  const selectDay = (day: number) => {
    if (isPastDay(day)) return;
    const newDate = new Date(currentYear, currentMonth, day);
    updateDateTime(newDate, selectedHour, selectedMinute);
  };

  const selectQuickTime = (hour: number, minute: number) => {
    updateDateTime(selectedDate, hour, minute);
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 sm:p-5 shadow-sm">
        
        {/* Left: Monthly Calendar */}
        <div className="lg:col-span-7 space-y-3">
          {/* Header Month / Nav */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <CalendarIcon size={15} className="text-sky-500 dark:text-sky-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                {MONTHS_FR[currentMonth]} {currentYear}
              </h4>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="h-8 w-8 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="h-8 w-8 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 text-center">
            {DAYS_SHORT_FR.map((d) => (
              <span key={d} className="text-[9px] font-black uppercase text-slate-400 dark:text-white/30 tracking-widest py-0.5">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Blank offsets */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="h-8 sm:h-9 w-full" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isPast = isPastDay(day);
              const dayDate = new Date(currentYear, currentMonth, day);
              const isSelected = isSameDay(dayDate, selectedDate);
              const isToday = isSameDay(dayDate, new Date());

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={isPast}
                  onClick={() => selectDay(day)}
                  className={cn(
                    "h-8 sm:h-9 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center relative cursor-pointer",
                    isSelected
                      ? "bg-sky-500 text-white dark:bg-sky-400 dark:text-black font-black shadow-md shadow-sky-400/30 scale-105"
                      : isPast
                      ? "text-slate-300 dark:text-white/10 cursor-not-allowed"
                      : "text-slate-700 dark:text-white/80 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white",
                    isToday && !isSelected && "border border-sky-500/40 text-sky-600 dark:text-sky-400"
                  )}
                >
                  {day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-sky-500 dark:bg-sky-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Time Selector */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-white/5 pt-4 lg:pt-0 lg:pl-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              <Clock size={15} className="text-sky-500 dark:text-sky-400 shrink-0" />
              <span>Heure d'envoi</span>
            </div>

            {/* Quick slots */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 block">
                Créneaux recommandés :
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                {QUICK_HOURS.map((slot) => {
                  const isSlotSelected = selectedHour === slot.hour && selectedMinute === slot.minute;
                  return (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => selectQuickTime(slot.hour, slot.minute)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between",
                        isSlotSelected
                          ? "bg-sky-500/15 border-sky-500 text-sky-600 dark:bg-sky-500/20 dark:border-sky-400 dark:text-sky-400 shadow-sm"
                          : "bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 shadow-sm"
                      )}
                    >
                      <div>
                        <p className="text-xs font-black font-mono leading-none">{slot.label}</p>
                        <p className="text-[8px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mt-0.5">{slot.tag}</p>
                      </div>
                      {isSlotSelected && <Check size={11} className="text-sky-500 dark:text-sky-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hour & Minute Selector */}
            <div className="space-y-1 pt-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 block">
                Heure exacte :
              </span>
              <div className="flex items-center gap-2 bg-white dark:bg-black/70 border border-slate-200/80 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-sm">
                <select
                  value={selectedHour}
                  onChange={(e) => updateDateTime(selectedDate, parseInt(e.target.value, 10), selectedMinute)}
                  className="bg-transparent text-slate-900 dark:text-white font-mono font-bold text-xs sm:text-sm outline-none cursor-pointer flex-1"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i} className="bg-white dark:bg-[#121614] text-slate-900 dark:text-white">
                      {i.toString().padStart(2, "0")} h
                    </option>
                  ))}
                </select>

                <span className="text-slate-400 dark:text-white/40 font-mono font-bold">:</span>

                <select
                  value={selectedMinute}
                  onChange={(e) => updateDateTime(selectedDate, selectedHour, parseInt(e.target.value, 10))}
                  className="bg-transparent text-slate-900 dark:text-white font-mono font-bold text-xs sm:text-sm outline-none cursor-pointer flex-1"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m} className="bg-white dark:bg-[#121614] text-slate-900 dark:text-white">
                      {m.toString().padStart(2, "0")} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer summary banner */}
      <div className="p-2.5 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-[11px] text-sky-700 dark:text-sky-400">
          <Sparkles size={13} className="shrink-0 animate-pulse text-sky-500 dark:text-sky-400" />
          <span>
            Diffusion prévue le{" "}
            <strong className="text-slate-900 dark:text-white capitalize">
              {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </strong>{" "}
            à{" "}
            <strong className="text-slate-900 dark:text-white">
              {selectedHour.toString().padStart(2, "0")}:{selectedMinute.toString().padStart(2, "0")}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
