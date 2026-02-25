import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bed, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const BED_TYPES = [
  { key: 'icu', label: 'ICU', color: 'from-red-500 to-red-600' },
  { key: 'general', label: 'General', color: 'from-blue-500 to-blue-600' },
  { key: 'emergency', label: 'Emergency', color: 'from-amber-500 to-amber-600' },
  { key: 'ventilator', label: 'Ventilator', color: 'from-purple-500 to-purple-600' },
];

export default function BedManagement({ hospital, onUpdated }) {
  const [beds, setBeds] = useState({
    icu_beds_total: hospital?.icu_beds_total || 0,
    icu_beds_available: hospital?.icu_beds_available || 0,
    general_beds_total: hospital?.general_beds_total || 0,
    general_beds_available: hospital?.general_beds_available || 0,
    emergency_beds_total: hospital?.emergency_beds_total || 0,
    emergency_beds_available: hospital?.emergency_beds_available || 0,
    ventilator_beds_total: hospital?.ventilator_beds_total || 0,
    ventilator_beds_available: hospital?.ventilator_beds_available || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Calculate ICU load prediction
    const icuPct = beds.icu_beds_total > 0 ? (beds.icu_beds_available / beds.icu_beds_total) * 100 : 100;
    const prediction = icuPct <= 15 ? 'high' : icuPct <= 40 ? 'medium' : 'safe';

    await base44.entities.Hospital.update(hospital.id, { ...beds, icu_load_prediction: prediction });
    const user = await base44.auth.me();
    await base44.entities.AuditLog.create({
      admin_email: user.email,
      action: 'bed_update',
      details: `Updated bed counts. ICU: ${beds.icu_beds_available}/${beds.icu_beds_total}`,
      hospital_id: hospital.id,
    });
    toast.success('Bed counts updated!');
    setSaving(false);
    onUpdated?.();
  };

  if (!hospital) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bed className="w-5 h-5 text-blue-600" /> Bed Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BED_TYPES.map((type) => {
            const totalKey = `${type.key}_beds_total`;
            const availKey = `${type.key}_beds_available`;
            const pct = beds[totalKey] > 0 ? (beds[availKey] / beds[totalKey]) * 100 : 0;
            return (
              <div key={type.key} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${type.color}`} />
                  <span className="font-semibold text-sm">{type.label}</span>
                  <span className="ml-auto text-xs text-slate-400">{pct.toFixed(0)}% available</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-500">Total</Label>
                    <Input
                      type="number"
                      min={0}
                      value={beds[totalKey]}
                      onChange={(e) => setBeds({ ...beds, [totalKey]: parseInt(e.target.value) || 0 })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Available</Label>
                    <Input
                      type="number"
                      min={0}
                      max={beds[totalKey]}
                      value={beds[availKey]}
                      onChange={(e) => setBeds({ ...beds, [availKey]: Math.min(parseInt(e.target.value) || 0, beds[totalKey]) })}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${type.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Bed Counts
        </Button>
      </CardContent>
    </Card>
  );
}
