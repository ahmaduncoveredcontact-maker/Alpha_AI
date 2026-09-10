'use client';

import { useState, useEffect, useMemo } from 'react';

interface WeekScheduleViewProps {
  working_days: string[];
  working_hours_start: string;
  working_hours_end: string;
  onDayToggle: (day: string) => void;
  onHoursChange: (start: string, end: string) => void;
  readOnly?: boolean;
  onDayTimeChange?: (day: string, start: string, end: string) => void;
  dayTimes?: { [key: string]: { start: string; end: string } };
  buffer_time?: number;
  onBufferTimeChange?: (minutes: number) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ✅ Sanitize a time string: reject empty, "00:00", or anything not HH:MM
const sanitizeTime = (value: string, fallback: string): string => {
  if (!value || value === '00:00' || !/^\d{2}:\d{2}$/.test(value)) {
    return fallback;
  }
  return value;
};

export default function WeekScheduleView({
  working_days,
  working_hours_start,
  working_hours_end,
  onDayToggle,
  onHoursChange,
  readOnly = false,
  onDayTimeChange,
  dayTimes = {},
  buffer_time = 15,
  onBufferTimeChange,
}: WeekScheduleViewProps) {
  const defaultStart = sanitizeTime(working_hours_start, '09:00');
  const defaultEnd = sanitizeTime(working_hours_end, '17:00');

  // ✅ Memoize so it doesn't recompute on every parent render
  const weekDays = useMemo(() => {
    const today = new Date();
    const nextDays = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayIndex = date.getDay();
      const dayName = DAYS[dayIndex === 0 ? 6 : dayIndex - 1];
      const isToday = i === 0;
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const daySchedule = dayTimes[dayName] || {};
      const isEnabled = working_days.includes(dayName);

      // ✅ Sanitize both start and end
      const safeStart = sanitizeTime(daySchedule.start, defaultStart);
      const safeEnd = sanitizeTime(daySchedule.end, defaultEnd);

      nextDays.push({
        key: dayName,
        label: isToday ? `Today (${dayName})` : dayName,
        date: dateStr,
        isToday,
        enabled: isEnabled,
        start: safeStart,
        end: safeEnd,
      });
    }
    return nextDays;
  }, [working_days, defaultStart, defaultEnd, dayTimes]);

  const handleDayTimeChangeLocal = (dayKey: string, start: string, end: string) => {
    if (!onDayTimeChange) return;

    // ✅ Sanitize before propagating
    const safeStart = sanitizeTime(start, defaultStart);
    const safeEnd = sanitizeTime(end, defaultEnd);

    console.log('⏰ Time change:', dayKey, safeStart, safeEnd);
    onDayTimeChange(dayKey, safeStart, safeEnd);
  };

  return (
    <div className="space-y-4">
      {/* Buffer Time Control */}
      {!readOnly && onBufferTimeChange && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Buffer Time Between Appointments (minutes)
          </label>
          <input
            type="number"
            min="0"
            step="5"
            value={buffer_time}
            onChange={(e) => onBufferTimeChange(parseInt(e.target.value) || 0)}
            className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Time gap between appointments (cleanup, notes, travel)
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {weekDays.map((day) => (
          <div
            key={day.key}
            className={`p-3 rounded-lg border-2 transition ${
              readOnly ? 'cursor-default' : ''
            } ${
              day.enabled
                ? 'border-[#4285F4] bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50'
            } ${day.isToday ? 'ring-2 ring-[#4285F4] ring-offset-2' : ''}`}
          >
            {/* Day header with toggle */}
            <div
              className={`text-center ${!readOnly ? 'cursor-pointer' : ''}`}
              onClick={() => !readOnly && onDayToggle(day.key)}
            >
              <div className="text-xs text-gray-500 dark:text-gray-400">{day.date}</div>
              <div className="text-xs sm:text-sm font-semibold mt-1 truncate text-gray-700 dark:text-gray-300">
                {day.label.split('(')[0].trim()}
              </div>
              <div className="text-xs mt-1">{day.enabled ? '✅' : '❌'}</div>
            </div>

            {/* Per-day time controls */}
            {day.enabled && !readOnly && (
              <div className="mt-2 space-y-1.5">
                <input
                  type="time"
                  value={day.start}
                  onChange={(e) => handleDayTimeChangeLocal(day.key, e.target.value, day.end)}
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 focus:ring-1 focus:ring-[#4285F4] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="time"
                  value={day.end}
                  onChange={(e) => handleDayTimeChangeLocal(day.key, day.start, e.target.value)}
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 focus:ring-1 focus:ring-[#4285F4] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Read-only display */}
            {day.enabled && readOnly && (
              <div className="mt-2 text-center">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  {day.start} – {day.end}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Global time controls */}
      {!readOnly && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Default Start Time</label>
            <input
              type="time"
              value={defaultStart}
              onChange={(e) => {
                const v = sanitizeTime(e.target.value, '09:00');
                onHoursChange(v, defaultEnd);
              }}
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#4285F4] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Used for days without specific times</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Default End Time</label>
            <input
              type="time"
              value={defaultEnd}
              onChange={(e) => {
                const v = sanitizeTime(e.target.value, '17:00');
                onHoursChange(defaultStart, v);
              }}
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#4285F4] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Used for days without specific times</p>
          </div>
        </div>
      )}
    </div>
  );
}