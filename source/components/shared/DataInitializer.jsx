import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Loader2, Database, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CITIES = ['Hyderabad', 'Bangalore', 'Chennai', 'Mumbai', 'Delhi'];

export default function DataInitializer({ onComplete }) {
  const [status, setStatus] = useState('checking');
  const [progress, setProgress] = useState('');

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setStatus('loading');
      setProgress('Checking existing data...');

      // Check if hospitals exist
      const existingHospitals = await base44.entities.Hospital.list();
      const existingAmbulances = await base44.entities.Ambulance.list();

      if (existingHospitals.length > 0 && existingAmbulances.length > 0) {
        setStatus('complete');
        onComplete?.();
        return;
      }

      // Fetch real hospital data from internet
      setProgress('Fetching real hospital data from across India...');
      
      const hospitalDataResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate real hospital data for emergency management system in these Indian cities: Hyderabad, Bangalore, Chennai, Mumbai, Delhi.

For each city, provide 3-4 major well-known hospitals with:
- Exact real hospital names
- Real addresses
- Approximate real latitude/longitude coordinates
- Real phone numbers (use actual hospital numbers if known, otherwise use format +91 XX XXXX XXXX)
- Realistic bed capacity (ICU: 20-60, General: 80-250, Emergency: 15-40, Ventilator: 10-30)
- Current availability should be 40-80% of total capacity
- Rating between 4.0-4.8
- Review count between 500-5000
- ICU load prediction: randomly assign 'safe', 'medium', or 'high' based on availability percentage

Return ONLY valid JSON array with no markdown, no explanations.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            hospitals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  city: { type: "string" },
                  address: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  phone: { type: "string" },
                  rating: { type: "number" },
                  total_reviews: { type: "number" },
                  icu_beds_total: { type: "number" },
                  icu_beds_available: { type: "number" },
                  general_beds_total: { type: "number" },
                  general_beds_available: { type: "number" },
                  emergency_beds_total: { type: "number" },
                  emergency_beds_available: { type: "number" },
                  ventilator_beds_total: { type: "number" },
                  ventilator_beds_available: { type: "number" },
                  icu_load_prediction: { type: "string" }
                }
              }
            }
          }
        }
      });

      setProgress('Creating hospital records...');
      
      // Create hospital records
      const hospitalsToCreate = hospitalDataResponse.hospitals.map(h => ({
        ...h,
        admin_email: '',
        is_active: true
      }));

      await base44.entities.Hospital.bulkCreate(hospitalsToCreate);

      // Generate ambulances
      setProgress('Generating ambulance fleet...');
      
      const ambulances = [];
      const ambulanceTypes = ['BLS', 'ALS'];
      
      for (const city of CITIES) {
        // Get city center from hospitals
        const cityHospitals = hospitalsToCreate.filter(h => h.city === city);
        if (cityHospitals.length === 0) continue;
        
        const centerLat = cityHospitals.reduce((sum, h) => sum + h.latitude, 0) / cityHospitals.length;
        const centerLng = cityHospitals.reduce((sum, h) => sum + h.longitude, 0) / cityHospitals.length;
        
        // Create 3-5 ambulances per city
        for (let i = 0; i < 4; i++) {
          const randomOffset = () => (Math.random() - 0.5) * 0.1;
          ambulances.push({
            vehicle_number: `${city.substring(0, 2).toUpperCase()} ${String(Math.floor(Math.random() * 99) + 1).padStart(2, '0')} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${Math.floor(1000 + Math.random() * 9000)}`,
            type: ambulanceTypes[i % 2],
            city: city,
            latitude: centerLat + randomOffset(),
            longitude: centerLng + randomOffset(),
            is_available: true,
            driver_name: `Driver ${i + 1}`,
            driver_phone: `+91 ${98700 + Math.floor(Math.random() * 1000)} ${10000 + Math.floor(Math.random() * 90000)}`
          });
        }
      }

      await base44.entities.Ambulance.bulkCreate(ambulances);

      setProgress('System ready!');
      setStatus('complete');
      
      setTimeout(() => {
        onComplete?.();
      }, 1500);

    } catch (error) {
      console.error('Data initialization error:', error);
      setStatus('error');
      setProgress('Error loading data. Please refresh the page.');
    }
  };

  if (status === 'complete') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="p-8 max-w-md w-full text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Initializing System</h2>
              <p className="text-sm text-slate-500 mb-4">{progress}</p>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-sm text-slate-600">Please wait...</span>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Initialization Failed</h2>
              <p className="text-sm text-red-600">{progress}</p>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
