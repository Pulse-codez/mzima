import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';

import Home from './pages/index';
import Simulation from './pages/simulation';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';
import ClerkDashboard from './pages/clerk/ClerkDashboard';
import NurseDashboard from './pages/nurse/NurseDashboard';
import ShiftLeadDashboard from './pages/shiftlead/ShiftLeadDashboard';
import { SEO } from './components/seo/SEO';
import TilesLoader from './components/originkit/ui/tiles-loader';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <BrowserRouter>
      <AuthProvider>
        {isLoading ? (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#063328] text-white">
            <div className="mb-2 font-heading text-4xl font-extrabold tracking-tight text-white">
              Mzima
            </div>
            <div className="mb-8 text-stone-light/90 text-sm font-medium tracking-widest uppercase letter-spacing-widest">
              Outpatient queue &amp; appointment co-pilot
            </div>
            <TilesLoader
              background="#063328"
              accent="#0F6B53"
              minTime={3}
              onComplete={() => setIsLoading(false)}
            />
          </div>
        ) : (
          <>
            <SEO title="Home" />
            <Routes>
              <Route path="/" element={
                <>
                  <SEO title="Home" />
                  <Home />
                </>
              } />
              <Route path="/simulation" element={
                <>
                  <SEO title="Simulation" description="Run operational simulations for queue capacity, wait metrics, and bottleneck scenarios." />
                  <Simulation />
                </>
              } />
              <Route path="/login" element={
                <>
                  <SEO title="Log in" description="Staff sign-in for Mzima. Role-based access for clerks, nurses, shift leads, and administrators." type="webpage" />
                  <Login />
                </>
              } />
              <Route path="/sign-up" element={
                <>
                  <SEO title="Sign up" description="Create a staff account (admin invitation only). Mzima does not offer patient self-registration." type="webpage" />
                  <SignUp />
                </>
              } />
              <Route
                path="/visits"
                element={
                  <>
                    <SEO title="Walk-in visits & queue" description="Register walk-in patients and view the weighted queue ordered by red flags, wait cap, and age-weighted score." type="webpage" />
                    <RequireAuth role="clerk">
                      <ClerkDashboard />
                    </RequireAuth>
                  </>
                }
              />
              <Route
                path="/triage"
                element={
                  <>
                    <SEO title="Triage" description="Nurse triage workflow — record category and destination with clinical warning-sign validation." type="webpage" />
                    <RequireAuth role="nurse">
                      <NurseDashboard />
                    </RequireAuth>
                  </>
                }
              />
              <Route
                path="/review"
                element={
                  <>
                    <SEO title="Appointment review" description="Clinician review queue — approve or reject appointment proposals with a recorded reason and audit trail." type="webpage" />
                    <RequireAuth role="shift_lead">
                      <ShiftLeadDashboard />
                    </RequireAuth>
                  </>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </>
        )}
      </AuthProvider>
    </BrowserRouter>
  );
}
