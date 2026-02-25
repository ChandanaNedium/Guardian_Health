import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Clock, CheckCircle2, XCircle } from 'lucide-react';
import moment from 'moment';

const statusConfig = {
  Pending: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  Approved: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  Rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  Discharged: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: CheckCircle2 },
};

export default function MyBookings({ bookings }) {
  if (!bookings || bookings.length === 0) {
    return (
      <Card className="p-6 text-center text-slate-400">
        <ClipboardList className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">No bookings yet</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-600" /> My Bookings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bookings.map((b) => {
          const cfg = statusConfig[b.status] || statusConfig.Pending;
          const Icon = cfg.icon;
          return (
            <div key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{b.hospital_name}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{b.bed_type} • {b.condition_type}</span>
                  <span>• {moment(b.created_date).fromNow()}</span>
                </div>
              </div>
              <Badge className={`${cfg.color} border flex items-center gap-1`}>
                <Icon className="w-3 h-3" /> {b.status}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
