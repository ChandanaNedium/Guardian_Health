import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useLocation, getDistanceKm } from '../shared/LocationProvider';
import LoadPredictionBadge from '../shared/LoadPredictionBadge';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapRecenter({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function HospitalMap({ hospitals, onSelectHospital }) {
  const { location } = useLocation();
  const center = location ? [location.lat, location.lng] : [17.385, 78.4867];

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 400 }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={center} />
        
        {location && (
          <>
            <Marker position={[location.lat, location.lng]} icon={userIcon}>
              <Popup>Your Location</Popup>
            </Marker>
            <Circle center={[location.lat, location.lng]} radius={5000} pathOptions={{ color: '#3b82f6', fillOpacity: 0.05 }} />
          </>
        )}

        {hospitals.map((h) => {
          const dist = location ? getDistanceKm(location.lat, location.lng, h.latitude, h.longitude).toFixed(1) : '?';
          const loadColor = h.icu_load_prediction === 'high' ? '#ef4444' : h.icu_load_prediction === 'medium' ? '#f59e0b' : '#10b981';
          return (
            <React.Fragment key={h.id}>
              <Marker position={[h.latitude, h.longitude]} icon={hospitalIcon}>
                <Popup>
                  <div className="text-sm min-w-[200px]">
                    <p className="font-bold text-base">{h.name}</p>
                    <p className="text-slate-500">{dist} km away</p>
                    <div className="mt-2 space-y-1">
                      <p>ICU: <strong>{h.icu_beds_available || 0}</strong>/{h.icu_beds_total || 0}</p>
                      <p>General: <strong>{h.general_beds_available || 0}</strong>/{h.general_beds_total || 0}</p>
                      <p>Emergency: <strong>{h.emergency_beds_available || 0}</strong>/{h.emergency_beds_total || 0}</p>
                      <p>Ventilator: <strong>{h.ventilator_beds_available || 0}</strong>/{h.ventilator_beds_total || 0}</p>
                    </div>
                    <p className="mt-2">📞 {h.phone || 'N/A'}</p>
                    <p>⭐ {h.rating || 'N/A'} ({h.total_reviews || 0} reviews)</p>
                    <button
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs w-full"
                      onClick={() => onSelectHospital(h)}
                    >
                      Book Bed
                    </button>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[h.latitude, h.longitude]}
                radius={200}
                pathOptions={{ color: loadColor, fillColor: loadColor, fillOpacity: 0.3 }}
              />
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
