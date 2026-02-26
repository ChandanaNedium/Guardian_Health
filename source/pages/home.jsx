import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Stethoscope, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function Home() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleContinue = async (role) => {
    setSelectedRole(role);
    setLoggingIn(true);
    
    // Store selected role in sessionStorage before redirect
    sessionStorage.setItem('selectedRole', role);
    
    // Check if already logged in
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      const user = await base44.auth.me();
      // Save the role selection
      await base44.auth.updateMe({ selected_role: role });
      if (role === 'patient') {
        window.location.href = createPageUrl('PatientDashboard');
      } else {
        window.location.href = createPageUrl('AdminDashboard');
      }
    } else {
      // Redirect to login, then come back
      const targetPage = role === 'patient' ? 'PatientDashboard' : 'AdminDashboard';
      base44.auth.redirectToLogin(createPageUrl(targetPage));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo & Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-200 mb-5">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">MedEmergency</h1>
          <p className="text-slate-500 mt-2 text-sm">AI-Powered Hospital Emergency Management</p>
        </motion.div>

        {/* Role Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <Card
            className={`p-6 cursor-pointer border-2 transition-all duration-300 hover:shadow-lg hover:border-blue-300 ${
              selectedRole === 'patient' ? 'border-blue-500 bg-blue-50/50 shadow-lg' : 'border-slate-200'
            }`}
            onClick={() => !loggingIn && handleContinue('patient')}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                <Stethoscope className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-slate-900">Continue as Patient</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Find hospitals, book beds, request ambulances
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
          </Card>

          <Card
            className={`p-6 cursor-pointer border-2 transition-all duration-300 hover:shadow-lg hover:border-emerald-300 ${
              selectedRole === 'admin' ? 'border-emerald-500 bg-emerald-50/50 shadow-lg' : 'border-slate-200'
            }`}
            onClick={() => !loggingIn && handleContinue('admin')}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-slate-900">Continue as Hospital Admin</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Manage beds, bookings, patients & analytics
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-slate-400 mt-8"
        >
          Serving Hyderabad, Bangalore, Chennai, Mumbai & Delhi
        </motion.p>
      </div>
    </div>
  );
}
