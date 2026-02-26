import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Heart, LogOut, User } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUser(u);
      }
    })();
  }, []);

  const isHomePage = currentPageName === 'Home';

  if (isHomePage) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    sessionStorage.removeItem('selectedRole');
    base44.auth.logout(createPageUrl('Home'));
  };

  const role = user?.selected_role;
  const isPatient = currentPageName === 'PatientDashboard';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">MedEmergency</span>
          </Link>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.full_name || user.email}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">
                  {isPatient ? 'Patient' : 'Admin'}
                </span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
