import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, LogOut, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import moment from 'moment';

export default function AdmittedPatients({ bookings, hospital, onUpdated }) {
  const [discharging, setDischarging] = useState(null);
  const admitted = bookings.filter((b) => b.status === 'Approved');

  const handleDischarge = async (booking) => {
    setDischarging(booking.id);
    const user = await base44.auth.me();

    // Create discharge record
    await base44.entities.DischargeRecord.create({
      patient_name: booking.patient_name,
      patient_email: booking.patient_email,
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      bed_type: booking.bed_type,
      condition_type: booking.condition_type,
      admitted_date: booking.updated_date || booking.created_date,
      discharged_date: new Date().toISOString(),
      booking_id: booking.id,
    });

    // Update booking status
    await base44.entities.BedBooking.update(booking.id, { status: 'Discharged' });

    // Increase available beds
    const bedKey = `${booking.bed_type.toLowerCase()}_beds_available`;
    const current = hospital[bedKey] || 0;
    const total = hospital[`${booking.bed_type.toLowerCase()}_beds_total`] || 0;
    const newAvail = Math.min(current + 1, total);
    const updateData = { [bedKey]: newAvail };
    
    // Recalculate ICU prediction
    const icuAvail = booking.bed_type === 'ICU' ? newAvail : hospital.icu_beds_available;
    const icuTotal = hospital.icu_beds_total || 1;
    const icuPct = (icuAvail / icuTotal) * 100;
    updateData.icu_load_prediction = icuPct <= 15 ? 'high' : icuPct <= 40 ? 'medium' : 'safe';
    
    await base44.entities.Hospital.update(hospital.id, updateData);

    await base44.entities.AuditLog.create({
      admin_email: user.email,
      action: 'patient_discharged',
      details: `Discharged ${booking.patient_name} from ${booking.bed_type} bed`,
      hospital_id: hospital.id,
      related_id: booking.id,
    });

    toast.success(`${booking.patient_name} has been discharged`);
    setDischarging(null);
    onUpdated?.();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-600" /> Admitted Patients ({admitted.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {admitted.length === 0 && (
          <p className="text-center text-slate-400 py-8 text-sm">No admitted patients</p>
        )}
        <div className="space-y-3">
          {admitted.map((b) => (
            <div key={b.id} className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{b.patient_name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <Badge variant="outline" className="text-xs">{b.bed_type}</Badge>
                  <span>{b.condition_type}</span>
                  <span>• Admitted {moment(b.updated_date).fromNow()}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                onClick={() => handleDischarge(b)}
                disabled={discharging === b.id}
              >
                {discharging === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-3 h-3 mr-1" /> Discharge</>}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
