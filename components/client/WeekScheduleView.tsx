'use client';

import { useState, useEffect } from 'react';

interface DaySchedule {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

interface WeekScheduleViewProps {
  working_days: string[];
  working_hours_start: string;
  working_hours_end: string;
  onDayToggle: (day: string) => void;
  onHoursChange: (start: string, end: string) => void;
  readOnly?: boolean;
  onDayTimeChange?: (day: string, start: string, end: string) => void;
  dayTimes?: { [key: string]: { start: string; end: string } };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeekScheduleView({
  working_days,
  working_hours_start,
  working_hours_end,
  onDayToggle,
  onHoursChange,
  readOnly = false,
  onDayTimeChange,
  dayTimes = {},
}: WeekScheduleViewProps) {
  const [weekDays, setWeekDays] = useState<any[]>([]);

  useEffect(() => {
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
      nextDays.push({
        key: dayName,
        label: isToday ? `Today (${dayName})` : dayName,
        date: dateStr,
        isToday,
        enabled: isEnabled,
        start: daySchedule.start || working_hours_start || '09:00',
        end: daySchedule.end || working_hours_end || '17:00',
      });
    }
    setWeekDays(nextDays);
  }, [working_days, working_hours_start, working_hours_end, dayTimes]);

  const handleDayTimeChangeLocal = (dayKey: string, start: string, end: string) => {
    if (onDayTimeChange) {
      onDayTimeChange(dayKey, start, end);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {weekDays.map((day) => (
          <div
            key={day.key}
            className={`p-3 rounded-lg border-2 transition ${
              readOnly ? 'cursor-default' : ''
            } ${
              day.enabled
                ? 'border-[#4285F4] bg-blue-50'
                : 'border-gray-200 bg-gray-50 opacity-50'
            } ${day.isToday ? 'ring-2 ring-[#4285F4] ring-offset-2' : ''}`}
          >
            {/* Day header with toggle */}
            <div
              className={`text-center ${!readOnly ? 'cursor-pointer' : ''}`}
              onClick={() => !readOnly && onDayToggle(day.key)}
            >
              <div className="text-xs text-gray-500">{day.date}</div>
              <div className="text-xs sm:text-sm font-semibold mt-1 truncate">
                {day.label.split('(')[0].trim()}
              </div>
              <div className="text-xs mt-1">{day.enabled ? '✅' : '❌'}</div>
            </div>

            {/* Per-day time controls - only show if enabled and not readOnly */}
            {day.enabled && !readOnly && (
              <div className="mt-2 space-y-1.5">
                <input
                  type="time"
                  value={day.start}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    handleDayTimeChangeLocal(day.key, newStart, day.end);
                  }}
                  className="w-full text-xs border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-[#4285F4] outline-none"
                />
                <input
                  type="time"
                  value={day.end}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    handleDayTimeChangeLocal(day.key, day.start, newEnd);
                  }}
                  className="w-full text-xs border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-[#4285F4] outline-none"
                />
              </div>
            )}

            {/* Show times for enabled days in read-only mode */}
            {day.enabled && readOnly && (
              <div className="mt-2 text-center">
                <div className="text-[10px] text-gray-500">
                  {day.start} – {day.end}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Global time controls (fallback for days without specific times) */}
      {!readOnly && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-gray-500">Default Start Time</label>
            <input
              type="time"
              value={working_hours_start || '09:00'}
              onChange={(e) => onHoursChange(e.target.value, working_hours_end || '17:00')}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#4285F4] outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Used for days without specific times</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Default End Time</label>
            <input
              type="time"
              value={working_hours_end || '17:00'}
              onChange={(e) => onHoursChange(working_hours_start || '09:00', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#4285F4] outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Used for days without specific times</p>
          </div>
        </div>
      )}
    </div>
  );
}