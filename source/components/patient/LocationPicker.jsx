import React from 'react';
import { useLocation, CITY_CENTERS } from '../shared/LocationProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function LocationPicker() {
  const { location, locationError, loading, setManualLocation } = useLocation();

  if (loading) {
    return (
      <Card className="p-4 flex items-center gap-3 bg-slate-50 border-slate-200">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm text-slate-600">Detecting your location...</span>
      </Card>
    );
  }

  if (locationError && !location) {
    return (
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">Could not detect location</span>
        </div>
        <Select onValueChange={setManualLocation}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Select your city" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(CITY_CENTERS).map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <MapPin className="w-4 h-4 text-blue-600" />
      <span>Location: {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}</span>
    </div>
  );
}
