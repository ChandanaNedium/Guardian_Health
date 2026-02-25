import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Star, Bed, Activity } from 'lucide-react';
import LoadPredictionBadge from '../shared/LoadPredictionBadge';
import { getDistanceKm } from '../shared/LocationProvider';

function BedStat({ label, available, total }) {
  const pct = total > 0 ? (available / total) * 100 : 0;
  const color = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold">{available}/{total}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function HospitalCard({ hospital, userLocation, onBookBed }) {
  const dist = userLocation
    ? getDistanceKm(userLocation.lat, userLocation.lng, hospital.latitude, hospital.longitude).toFixed(1)
    : null;

  return (
    <Card className="p-5 hover:shadow-lg transition-all duration-300 border-slate-200/80">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 truncate">{hospital.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {dist && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3" /> {dist} km
              </span>
            )}
            {hospital.phone && (
              <a href={`tel:${hospital.phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <Phone className="w-3 h-3" /> {hospital.phone}
              </a>
            )}
            {hospital.rating > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Star className="w-3 h-3 fill-amber-400" /> {hospital.rating}
                <span className="text-slate-400">({hospital.total_reviews})</span>
              </span>
            )}
          </div>
        </div>
        <LoadPredictionBadge level={hospital.icu_load_prediction} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <BedStat label="ICU" available={hospital.icu_beds_available || 0} total={hospital.icu_beds_total || 0} />
        <BedStat label="General" available={hospital.general_beds_available || 0} total={hospital.general_beds_total || 0} />
        <BedStat label="Emergency" available={hospital.emergency_beds_available || 0} total={hospital.emergency_beds_total || 0} />
        <BedStat label="Ventilator" available={hospital.ventilator_beds_available || 0} total={hospital.ventilator_beds_total || 0} />
      </div>

      <Button onClick={() => onBookBed(hospital)} className="w-full bg-blue-600 hover:bg-blue-700">
        <Bed className="w-4 h-4 mr-2" /> Book Bed
      </Button>
    </Card>
  );
}
