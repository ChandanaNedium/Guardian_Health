import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { BarChart3, Activity, TrendingUp, Truck } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function AnalyticsDashboard({ hospital, bookings, discharges, ambulanceBookings }) {
  // Bed occupancy data
  const bedData = [
    { name: 'ICU', occupied: (hospital?.icu_beds_total || 0) - (hospital?.icu_beds_available || 0), available: hospital?.icu_beds_available || 0 },
    { name: 'General', occupied: (hospital?.general_beds_total || 0) - (hospital?.general_beds_available || 0), available: hospital?.general_beds_available || 0 },
    { name: 'Emergency', occupied: (hospital?.emergency_beds_total || 0) - (hospital?.emergency_beds_available || 0), available: hospital?.emergency_beds_available || 0 },
    { name: 'Ventilator', occupied: (hospital?.ventilator_beds_total || 0) - (hospital?.ventilator_beds_available || 0), available: hospital?.ventilator_beds_available || 0 },
  ];

  // Severity distribution
  const severityData = ['Emergency', 'Serious', 'Normal'].map((s) => ({
    name: s,
    value: bookings.filter((b) => b.condition_type === s).length,
  })).filter(d => d.value > 0);

  // Daily admissions (last 7 days)
  const dailyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStr = date.toISOString().split('T')[0];
    const label = date.toLocaleDateString('en', { weekday: 'short' });
    dailyData.push({
      name: label,
      admissions: bookings.filter((b) => b.status === 'Approved' && b.created_date?.startsWith(dayStr)).length,
      discharges: discharges.filter((d) => d.discharged_date?.startsWith(dayStr)).length,
    });
  }

  const totalAmbulanceTrips = ambulanceBookings?.length || 0;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: Activity, color: 'text-blue-600 bg-blue-50' },
          { label: 'Admitted', value: bookings.filter(b => b.status === 'Approved').length, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Discharged', value: discharges.length, icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
          { label: 'Ambulance Trips', value: totalAmbulanceTrips, icon: Truck, color: 'text-amber-600 bg-amber-50' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bed Occupancy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Bed Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupied" fill="#ef4444" name="Occupied" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" fill="#10b981" name="Available" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {severityData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Daily Trends */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daily Admissions & Discharges (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="admissions" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="discharges" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
