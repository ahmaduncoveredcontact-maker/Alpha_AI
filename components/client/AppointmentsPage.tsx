'use client';

import { Calendar as CalendarIcon, Clock, MapPin, User, Phone } from 'lucide-react';

interface CallLog {
  _row: number;
  timestamp: string;
  customer_name: string;
  customer_phone: string;
  booked_time?: string;
  address?: string;
  status: string;
  summary: string;
}

export default function AppointmentsPage({ calls }: { calls: CallLog[] }) {
  const appointments = calls
    .filter(call => call.booked_time && call.booked_time !== '')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appointments</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upcoming and confirmed bookings
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-500 dark:text-gray-400">No appointments booked yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Appointments will appear here once calls are booked.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((call, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{call.customer_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {call.booked_time}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full font-medium">
                  Confirmed
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                {call.customer_phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    {call.customer_phone}
                  </p>
                )}
                {call.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {call.address}
                  </p>
                )}
                {call.summary && (
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-1 italic">"{call.summary}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}