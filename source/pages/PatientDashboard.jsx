import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Map, List, Truck, ClipboardList } from 'lucide-react';
import LocationProvider, { useLocation, getDistanceKm } from '../components/shared/LocationProvider';
import LocationPicker from '../components/patient/LocationPicker';
import HospitalMap from '../components/patient/HospitalMap';
import HospitalCard from '../components/patient/HospitalCard';
import BookBedDialog from '../components/patient/BookBedDialog';
import AmbulancePanel from '../components/patient/AmbulancePanel';
import MyBookings from '../components/patient/MyBookings';
import AIChatbot from '../components/patient/AIChatbot';
import HeatmapLegend from '../components/shared/HeatmapLegend';
import DataInitializer from '../components/shared/DataInitializer';

function PatientContent() {
  const [dataReady, setDataReady] = useState(false);
  const { location } = useLocation();
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => base44.entities.Hospital.filter({ is_active: true }),
  });

  const { data: ambulances = [] } = useQuery({
    queryKey: ['ambulances'],
    queryFn: () => base44.entities.Ambulance.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ['myBookings', user?.email],
    queryFn: () => base44.entities.BedBooking.filter({ patient_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  // Sort hospitals by distance
  const sortedHospitals = [...hospitals].sort((a, b) => {
    if (!location) return 0;
    const distA = getDistanceKm(location.lat, location.lng, a.latitude, a.longitude);
    const distB = getDistanceKm(location.lat, location.lng, b.latitude, b.longitude);
    return distA - distB;
  });

  const handleBookBed = (hospital) => {
    setSelectedHospital(hospital);
    setBookDialogOpen(true);
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    queryClient.invalidateQueries({ queryKey: ['ambulances'] });
    queryClient.invalidateQueries({ queryKey: ['myBookings'] });
  };

  // Check if data initialization is needed
  useEffect(() => {
    (async () => {
      const hospitals = await base44.entities.Hospital.list();
      if (hospitals.length > 0) {
        setDataReady(true);
      }
    })();
  }, []);

  if (!dataReady) {
    return <DataInitializer onComplete={() => setDataReady(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Emergency Dashboard</h1>
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            <LocationPicker />
            <HeatmapLegend />
          </div>
        </div>

        <Tabs defaultValue="map" className="space-y-4">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto">
            <TabsTrigger value="map" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Map className="w-4 h-4" /> Map
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <List className="w-4 h-4" /> Hospitals
            </TabsTrigger>
            <TabsTrigger value="ambulance" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Truck className="w-4 h-4" /> Ambulance
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <ClipboardList className="w-4 h-4" /> Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <HospitalMap hospitals={sortedHospitals} onSelectHospital={handleBookBed} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {sortedHospitals.slice(0, 6).map((h) => (
                <HospitalCard key={h.id} hospital={h} userLocation={location} onBookBed={handleBookBed} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedHospitals.map((h) => (
                <HospitalCard key={h.id} hospital={h} userLocation={location} onBookBed={handleBookBed} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ambulance">
            <AmbulancePanel ambulances={ambulances} hospitals={hospitals} onBooked={refresh} />
          </TabsContent>

          <TabsContent value="bookings">
            <MyBookings bookings={myBookings} />
          </TabsContent>
        </Tabs>
      </div>

      {selectedHospital && (
        <BookBedDialog
          hospital={selectedHospital}
          open={bookDialogOpen}
          onClose={() => { setBookDialogOpen(false); setSelectedHospital(null); }}
          onBooked={refresh}
        />
      )}

      <AIChatbot hospitals={sortedHospitals} ambulances={ambulances} />
    </div>
  );
}

export default function PatientDashboard() {
  // Save role on mount
  useEffect(() => {
    (async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        await base44.auth.updateMe({ selected_role: 'patient' });
      }
    })();
  }, []);

  return (
    <LocationProvider>
      <PatientContent />
    </LocationProvider>
  );
}
