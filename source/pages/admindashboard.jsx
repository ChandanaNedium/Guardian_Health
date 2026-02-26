import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bed, ClipboardList, UserCheck, BarChart3, Loader2, Building2, MapPin } from 'lucide-react';
import BedManagement from '../components/admin/BedManagement';
import BookingManagement from '../components/admin/BookingManagement';
import AdmittedPatients from '../components/admin/AdmittedPatients';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import LoadPredictionBadge from '../components/shared/LoadPredictionBadge';
import HeatmapLegend from '../components/shared/HeatmapLegend';

const CITIES = ['Hyderabad', 'Bangalore', 'Chennai', 'Mumbai', 'Delhi'];

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState('Hyderabad');
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);

  // Fetch all hospitals
  const { data: allHospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ['allHospitals'],
    queryFn: () => base44.entities.Hospital.list(),
  });

  const cityHospitals = allHospitals.filter(h => h.city === selectedCity);
  const hospital = cityHospitals.find(h => h.id === selectedHospitalId) || cityHospitals[0] || null;

  // Auto-select first hospital when city changes
  useEffect(() => {
    if (cityHospitals.length > 0) {
      setSelectedHospitalId(cityHospitals[0].id);
    }
  }, [selectedCity, allHospitals.length]);

  const { data: bookings = [] } = useQuery({
    queryKey: ['hospitalBookings', hospital?.id],
    queryFn: () => base44.entities.BedBooking.filter({ hospital_id: hospital.id }, '-created_date'),
    enabled: !!hospital?.id,
  });

  const { data: discharges = [] } = useQuery({
    queryKey: ['discharges', hospital?.id],
    queryFn: () => base44.entities.DischargeRecord.filter({ hospital_id: hospital.id }, '-discharged_date'),
    enabled: !!hospital?.id,
  });

  const { data: ambulanceBookings = [] } = useQuery({
    queryKey: ['ambulanceBookings', hospital?.id],
    queryFn: () => base44.entities.AmbulanceBooking.filter({ destination_hospital_id: hospital.id }),
    enabled: !!hospital?.id,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['allHospitals'] });
    queryClient.invalidateQueries({ queryKey: ['hospitalBookings'] });
    queryClient.invalidateQueries({ queryKey: ['discharges'] });
    queryClient.invalidateQueries({ queryKey: ['ambulanceBookings'] });
  };

  if (hospitalsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Loading hospitals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Top selector bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* City selector */}
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">City</span>
              <Select value={selectedCity} onValueChange={(v) => setSelectedCity(v)}>
                <SelectTrigger className="w-36 border-slate-200 bg-slate-50 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200" />

            {/* Hospital selector */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Hospital</span>
              <Select
                value={hospital?.id || ''}
                onValueChange={(v) => setSelectedHospitalId(v)}
                disabled={cityHospitals.length === 0}
              >
                <SelectTrigger className="flex-1 border-slate-200 bg-slate-50 text-sm font-medium max-w-xs">
                  <SelectValue placeholder="Select hospital..." />
                </SelectTrigger>
                <SelectContent>
                  {cityHospitals.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ICU load badge */}
            {hospital && (
              <div className="flex items-center gap-2 shrink-0">
                <LoadPredictionBadge level={hospital.icu_load_prediction} />
                <HeatmapLegend />
              </div>
            )}
          </div>

          {/* Hospital meta */}
          {hospital && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-x-5 gap-y-1">
              <span className="text-sm font-bold text-slate-900">{hospital.name}</span>
              {hospital.address && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{hospital.address}
                </span>
              )}
              {hospital.phone && (
                <span className="text-xs text-slate-500">📞 {hospital.phone}</span>
              )}
              <span className="text-xs text-slate-400">
                ⭐ {hospital.rating?.toFixed(1)} · {hospital.total_reviews?.toLocaleString()} reviews
              </span>
            </div>
          )}
        </div>

        {/* ICU Quick Stats */}
        {hospital && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'ICU Beds', avail: hospital.icu_beds_available, total: hospital.icu_beds_total, color: 'blue' },
              { label: 'General Beds', avail: hospital.general_beds_available, total: hospital.general_beds_total, color: 'emerald' },
              { label: 'Emergency Beds', avail: hospital.emergency_beds_available, total: hospital.emergency_beds_total, color: 'amber' },
              { label: 'Ventilators', avail: hospital.ventilator_beds_available, total: hospital.ventilator_beds_total, color: 'purple' },
            ].map(({ label, avail, total, color }) => {
              const pct = total > 0 ? Math.round((avail / total) * 100) : 0;
              const colorMap = {
                blue: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500', ring: 'ring-blue-100' },
                emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', ring: 'ring-emerald-100' },
                amber: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500', ring: 'ring-amber-100' },
                purple: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500', ring: 'ring-purple-100' },
              };
              const c = colorMap[color];
              return (
                <div key={label} className={`${c.bg} ring-1 ${c.ring} rounded-2xl p-4`}>
                  <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${c.text}`}>{avail ?? '—'}</p>
                  <p className="text-xs text-slate-400 mb-2">of {total ?? '—'} available</p>
                  <div className="w-full bg-white/70 rounded-full h-1.5">
                    <div className={`${c.bar} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        {hospital ? (
          <Tabs defaultValue="beds" className="space-y-4">
            <TabsList className="bg-white border border-slate-200 p-1 h-auto">
              <TabsTrigger value="beds" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Bed className="w-4 h-4" /> Beds
              </TabsTrigger>
              <TabsTrigger value="bookings" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <ClipboardList className="w-4 h-4" /> Bookings
              </TabsTrigger>
              <TabsTrigger value="admitted" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <UserCheck className="w-4 h-4" /> Admitted
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4" /> Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="beds">
              <BedManagement hospital={hospital} onUpdated={refresh} />
            </TabsContent>

            <TabsContent value="bookings">
              <BookingManagement bookings={bookings} hospital={hospital} onUpdated={refresh} />
            </TabsContent>

            <TabsContent value="admitted">
              <AdmittedPatients bookings={bookings} hospital={hospital} onUpdated={refresh} />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard
                hospital={hospital}
                bookings={bookings}
                discharges={discharges}
                ambulanceBookings={ambulanceBookings}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Building2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No hospitals found for {selectedCity}</p>
          </div>
        )}
      </div>
    </div>
  );
}
