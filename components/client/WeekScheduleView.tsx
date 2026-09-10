'use client';

import { useMemo } from 'react';

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
  event_length?: number;                    // ✅ NEW
  onEventLengthChange?: (minutes: number) => void;   // ✅ NEW
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const sanitizeTime = (value: string, fallback: string): string => {
  if (!value || value === '00:00' || !/^\d{2}:\d{2}$/.test(value)) {
    return fallback;
  }
  return value;
};

const COMMON_LENGTHS = [15, 30, 45, 60, 90, 120, 180];

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
  event_length = 30,
  onEventLengthChange,
}: WeekScheduleViewProps) {
  const defaultStart = sanitizeTime(working_hours_start, '09:00');
  const defaultEnd = sanitizeTime(working_hours_end, '17:00');

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
      nextDays.push({
        key: dayName,
        label: isToday ? `Today (${dayName})` : dayName,
        date: dateStr,
        isToday,
        enabled: isEnabled,
        start: sanitizeTime(daySchedule.start, defaultStart),
        end: sanitizeTime(daySchedule.end, defaultEnd),
      });
    }
    return nextDays;
  }, [working_days, defaultStart, defaultEnd, dayTimes]);

  const handleDayTimeChangeLocal = (dayKey: string, start: string, end: string) => {
    if (!onDayTimeChange) return;
    onDayTimeChange(dayKey, sanitizeTime(start, defaultStart), sanitizeTime(end, defaultEnd));
  };

  return (
    <div className="space-y-4">
      {/* ✅ Event Duration + Buffer controls */}
      {!readOnly && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {onEventLengthChange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Appointment Duration (minutes)
              </label>
              <div className="flex gap-2 mt-1">
                <select
                  value={COMMON_LENGTHS.includes(event_length) ? event_length : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      onEventLengthChange(parseInt(e.target.value));
                    }
                  }}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {COMMON_LENGTHS.map((m) => (
                    <option key={m} value={m}>{m} minutes</option>
                  ))}
                  <option value="custom">Custom…</option>
                </select>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={event_length}
                  onChange={(e) => onEventLengthChange(parseInt(e.target.value) || 30)}
                  className="w-24 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                How long each appointment takes (e.g., 120 min for HVAC/plumbing jobs)
              </p>
            </div>
          )}

          {onBufferTimeChange && (
            <div>
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
                Gap for cleanup, notes, or travel
              </p>
            </div>
          )}
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