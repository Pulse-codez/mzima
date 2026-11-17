import React from 'react';
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route
            path="/visits"
            element={
              <RequireAuth role="clerk">
                <ClerkDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/triage"
            element={
              <RequireAuth role="nurse">
                <NurseDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/review"
            element={
              <RequireAuth role="shift_lead">
                <ShiftLeadDashboard />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
