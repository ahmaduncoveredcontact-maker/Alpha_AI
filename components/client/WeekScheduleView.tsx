'use client';

import { useState, useEffect } from 'react';

interface WeekScheduleViewProps {
  working_days: string[];
  working_hours_start: string;
  working_hours_end: string;
  onDayToggle: (day: string) => void;
  onHoursChange: (start: string, end: string) => void;
  readOnly?: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeekScheduleView({
  working_days,
  working_hours_start,
  working_hours_end,
  onDayToggle,
  onHoursChange,
  readOnly = false,
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

      nextDays.push({
        key: dayName,
        label: isToday ? `Today (${dayName})` : dayName,
        date: dateStr,
        isToday,
        enabled: working_days.includes(dayName),
      });
    }
    setWeekDays(nextDays);
  }, [working_days]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {weekDays.map((day) => (
          <div
            key={day.key}
            className={`p-3 rounded-lg border-2 text-center transition ${
              readOnly ? 'cursor-default' : 'cursor-pointer'
            } ${
              day.enabled
                ? 'border-[#4285F4] bg-blue-50'
                : 'border-gray-200 bg-gray-50 opacity-50'
            } ${day.isToday ? 'ring-2 ring-[#4285F4] ring-offset-2' : ''}`}
            onClick={() => !readOnly && onDayToggle(day.key)}
          >
            <div className="text-xs text-gray-500">{day.date}</div>
            <div className="text-xs sm:text-sm font-semibold mt-1 truncate">
              {day.label.split('(')[0].trim()}
            </div>
            <div className="text-xs mt-1">{day.enabled ? '✅' : '❌'}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time</label>
          <input
            type="time"
            value={working_hours_start || '09:00'}
            onChange={(e) => onHoursChange(e.target.value, working_hours_end || '17:00')}
            disabled={readOnly}
            className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Time</label>
          <input
            type="time"
            value={working_hours_end || '17:00'}
            onChange={(e) => onHoursChange(working_hours_start || '09:00', e.target.value)}
            disabled={readOnly}
            className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4285F4] outline-none disabled:bg-gray-100"
          />
        </div>
      </div>
    </div>
  );
}