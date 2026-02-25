import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, MapPin, Clock, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { useLocation, getDistanceKm, estimateETA } from '../shared/LocationProvider';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AmbulancePanel({ ambulances, hospitals, onBooked }) {
  const { location } = useLocation();
  const [filter, setFilter] = useState('all');
  const [booking, setBooking] = useState(null);

  if (!location) {
    return (
      <Card className="p-6 text-center text-slate-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
        <p>Enable location to find nearby ambulances</p>
      </Card>
    );
  }

  const enriched = ambulances
    .filter((a) => a.is_available)
    .map((a) => ({
      ...a,
      distance: getDistanceKm(location.lat, location.lng, a.latitude, a.longitude),
      eta: estimateETA(getDistanceKm(location.lat, location.lng, a.latitude, a.longitude)),
    }))
    .sort((a, b) => a.distance - b.distance);

  const filtered = filter === 'all' ? enriched : enriched.filter((a) => a.type === filter);

  const handleBook = async (amb) => {
    setBooking(amb.id);
    const user = await base44.auth.me();
    const hospital = hospitals.find(h => h.id === amb.hospital_id);
    await base44.entities.AmbulanceBooking.create({
      patient_email: user.email,
      patient_name: user.full_name || user.email,
      ambulance_id: amb.id,
      ambulance_type: amb.type,
      vehicle_number: amb.vehicle_number,
      pickup_latitude: location.lat,
      pickup_longitude: location.lng,
      destination_hospital_id: amb.hospital_id || '',
      destination_hospital_name: hospital?.name || '',
      estimated_eta_minutes: amb.eta,
      distance_km: parseFloat(amb.distance.toFixed(2)),
    });
    await base44.entities.Ambulance.update(amb.id, { is_available: false });
    toast.success('Ambulance booked! It is on its way.');
    setBooking(null);
    onBooked?.();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="w-5 h-5 text-blue-600" /> Available Ambulances
          </CardTitle>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs px-3 h-7">All</TabsTrigger>
              <TabsTrigger value="BLS" className="text-xs px-3 h-7">BLS</TabsTrigger>
              <TabsTrigger value="ALS" className="text-xs px-3 h-7">ALS</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-6">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No available ambulances found</p>
          </div>
        )}
        {filtered.map((amb) => (
          <div key={amb.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-blue-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{amb.vehicle_number}</span>
                <Badge variant="outline" className={amb.type === 'ALS' ? 'border-red-200 text-red-700 bg-red-50' : 'border-blue-200 text-blue-700 bg-blue-50'}>
                  {amb.type}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {amb.distance.toFixed(1)} km</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{amb.eta} min</span>
                {amb.driver_phone && (
                  <a href={`tel:${amb.driver_phone}`} className="flex items-center gap-1 text-blue-600">
                    <Phone className="w-3 h-3" /> Call
                  </a>
                )}
              </div>
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shrink-0" onClick={() => handleBook(amb)} disabled={booking === amb.id}>
              {booking === amb.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Book'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
