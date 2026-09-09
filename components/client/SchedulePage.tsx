'use client';

import { useState, useEffect } from 'react';
import WeekScheduleView from './WeekScheduleView';
import { TIMEZONES } from '@/lib/constants/timezones';

interface Client {
  working_hours_start?: string;
  working_hours_end?: string;
  working_days?: string[];
  timezone?: string;
  cal_event_slug?: string;
  day_times?: { [key: string]: { start: string; end: string } };
  buffer_time?: number;
}

export default function SchedulePage({
  client,
  onUpdate,
  saving,
}: {
  client: Client;
  onUpdate: (data: any) => void;
  saving: boolean;
}) {
  const [scheduleData, setScheduleData] = useState({
    working_days: client.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    working_hours_start: client.working_hours_start || '09:00',
    working_hours_end: client.working_hours_end || '17:00',
    timezone: client.timezone || 'America/New_York',
    buffer_time: client.buffer_time ?? 15,
  });

  const [dayTimes, setDayTimes] = useState<{ [key: string]: { start: string; end: string } }>(
    client.day_times || {}
  );

  // ✅ Sync with client prop when it changes
  useEffect(() => {
    setScheduleData({
      working_days: client.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      working_hours_start: client.working_hours_start || '09:00',
      working_hours_end: client.working_hours_end || '17:00',
      timezone: client.timezone || 'America/New_York',
      buffer_time: client.buffer_time ?? 15,
    });
    setDayTimes(client.day_times || {});
  }, [client]);

  // ✅ Helper to send update with all data
  const sendUpdate = (data: any) => {
    const payload = {
      ...data,
      day_times: dayTimes,
      working_days: data.working_days || scheduleData.working_days,
      working_hours_start: data.working_hours_start || scheduleData.working_hours_start,
      working_hours_end: data.working_hours_end || scheduleData.working_hours_end,
      timezone: data.timezone || scheduleData.timezone,
      buffer_time: data.buffer_time ?? scheduleData.buffer_time,
    };
    onUpdate(payload);
  };

  const handleDayToggle = (day: string) => {
    const current = scheduleData.working_days || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    const newData = { ...scheduleData, working_days: updated };
    setScheduleData(newData);
    sendUpdate(newData);
  };

  const handleHoursChange = (start: string, end: string) => {
    const newData = { ...scheduleData, working_hours_start: start, working_hours_end: end };
    setScheduleData(newData);
    sendUpdate(newData);
  };

  const handleDayTimeChange = (day: string, start: string, end: string) => {
    const updated = { ...dayTimes, [day]: { start, end } };
    setDayTimes(updated);
    sendUpdate({ ...scheduleData, day_times: updated });
  };

  const handleTimezoneChange = (timezone: string) => {
    const newData = { ...scheduleData, timezone };
    setScheduleData(newData);
    sendUpdate(newData);
  };

  const handleBufferTimeChange = (minutes: number) => {
    const newData = { ...scheduleData, buffer_time: minutes };
    setScheduleData(newData);
    sendUpdate(newData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Schedule</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set your working hours for each day of the week
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <WeekScheduleView
          working_days={scheduleData.working_days}
          working_hours_start={scheduleData.working_hours_start}
          working_hours_end={scheduleData.working_hours_end}
          onDayToggle={handleDayToggle}
          onHoursChange={handleHoursChange}
          onDayTimeChange={handleDayTimeChange}
          dayTimes={dayTimes}
          buffer_time={scheduleData.buffer_time}
          onBufferTimeChange={handleBufferTimeChange}
        />

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
          <select
            value={scheduleData.timezone || 'America/New_York'}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4285F4] outline-none transition"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>

        {client.cal_event_slug && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Booking Link:</span>{' '}
              <a
                href={`https://cal.com/${process.env.NEXT_PUBLIC_CAL_USERNAME || 'alphaai'}/${client.cal_event_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                https://cal.com/alphaai/{client.cal_event_slug}
              </a>
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
              Click to edit availability, holidays, or buffer time directly in Cal.com.
            </p>
          </div>
        )}

        {saving && (
          <div className="mt-4 text-sm text-blue-600 dark:text-blue-400">Saving schedule...</div>
        )}
      </div>
    </div>
  );
}