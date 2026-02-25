import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLocation } from '../shared/LocationProvider';
import { toast } from 'sonner';

export default function BookBedDialog({ hospital, open, onClose, onBooked }) {
  const [form, setForm] = useState({ patient_name: '', patient_phone: '', condition_type: 'Normal', bed_type: 'General', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const { location } = useLocation();

  const handleSubmit = async () => {
    if (!form.patient_name) { toast.error('Please enter your name'); return; }
    setSubmitting(true);
    const user = await base44.auth.me();
    await base44.entities.BedBooking.create({
      ...form,
      patient_email: user.email,
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      patient_latitude: location?.lat,
      patient_longitude: location?.lng,
    });
    toast.success('Booking request sent!');
    setSubmitting(false);
    onBooked?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Bed at {hospital?.name}</DialogTitle>
          <DialogDescription>Fill in your details to request a bed</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.patient_name} onChange={(e) => setForm({...form, patient_name: e.target.value})} placeholder="Your full name" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.patient_phone} onChange={(e) => setForm({...form, patient_phone: e.target.value})} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Condition</Label>
              <Select value={form.condition_type} onValueChange={(v) => setForm({...form, condition_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Serious">Serious</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bed Type</Label>
              <Select value={form.bed_type} onValueChange={(v) => setForm({...form, bed_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Ventilator">Ventilator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Additional information..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
