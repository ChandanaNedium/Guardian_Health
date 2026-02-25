import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Clock, AlertTriangle, User, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import moment from 'moment';

const conditionColors = {
  Emergency: 'bg-red-100 text-red-800 border-red-200',
  Serious: 'bg-amber-100 text-amber-800 border-amber-200',
  Normal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function BookingManagement({ bookings, hospital, onUpdated }) {
  const [tab, setTab] = useState('Pending');
  const [processing, setProcessing] = useState(null);

  const filtered = bookings.filter((b) => b.status === tab);

  const handleAction = async (booking, action) => {
    setProcessing(booking.id);
    const user = await base44.auth.me();

    if (action === 'approve') {
      await base44.entities.BedBooking.update(booking.id, { status: 'Approved' });
      // Decrease available beds
      const bedKey = `${booking.bed_type.toLowerCase()}_beds_available`;
      const current = hospital[bedKey] || 0;
      if (current > 0) {
        const updateData = { [bedKey]: current - 1 };
        const icuTotal = booking.bed_type === 'ICU' ? hospital.icu_beds_total : hospital.icu_beds_total;
        const icuAvail = booking.bed_type === 'ICU' ? current - 1 : hospital.icu_beds_available;
        const icuPct = icuTotal > 0 ? (icuAvail / icuTotal) * 100 : 100;
        updateData.icu_load_prediction = icuPct <= 15 ? 'high' : icuPct <= 40 ? 'medium' : 'safe';
        await base44.entities.Hospital.update(hospital.id, updateData);
      }
      await base44.entities.AuditLog.create({
        admin_email: user.email,
        action: 'booking_approved',
        details: `Approved ${booking.bed_type} booking for ${booking.patient_name}`,
        hospital_id: hospital.id,
        related_id: booking.id,
      });
      toast.success('Booking approved');
    } else {
      await base44.entities.BedBooking.update(booking.id, { status: 'Rejected' });
      await base44.entities.AuditLog.create({
        admin_email: user.email,
        action: 'booking_rejected',
        details: `Rejected booking for ${booking.patient_name}`,
        hospital_id: hospital.id,
        related_id: booking.id,
      });
      toast.info('Booking rejected');
    }
    setProcessing(null);
    onUpdated?.();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Booking Requests</CardTitle>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-8">
              <TabsTrigger value="Pending" className="text-xs px-3 h-7">Pending</TabsTrigger>
              <TabsTrigger value="Approved" className="text-xs px-3 h-7">Approved</TabsTrigger>
              <TabsTrigger value="Rejected" className="text-xs px-3 h-7">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 py-8 text-sm">No {tab.toLowerCase()} bookings</p>
        )}
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-sm">{b.patient_name}</span>
                    <Badge className={`${conditionColors[b.condition_type]} border text-xs`}>
                      {b.condition_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{b.bed_type}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {b.patient_email} {b.patient_phone && `• ${b.patient_phone}`} • {moment(b.created_date).fromNow()}
                  </div>
                  {b.notes && <p className="text-xs text-slate-500 mt-1 italic">"{b.notes}"</p>}
                </div>
                {tab === 'Pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 h-8"
                      onClick={() => handleAction(b, 'approve')}
                      disabled={processing === b.id}
                    >
                      {processing === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                      onClick={() => handleAction(b, 'reject')}
                      disabled={processing === b.id}
                    >
                      <XCircle className="w-3 h-3 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
