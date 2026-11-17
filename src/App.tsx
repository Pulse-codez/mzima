import React from 'react';
import { useLocation } from './router';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Header } from './components/layout/Header';
import { HowItWorks } from './pages/HowItWorks';
import { Story } from './pages/Story';
import { SignUp } from './pages/SignUp';
import { Login } from './pages/Login';
import { Extract } from './pages/Extract';
import { ClerkLogin } from './pages/ClerkLogin';
import { NurseLogin } from './pages/NurseLogin';
import { ShiftLeadLogin } from './pages/ShiftLeadLogin';
import { ClerkDashboard } from './pages/clerk/ClerkDashboard';
import { NurseDashboard } from './pages/nurse/NurseDashboard';
import { ShiftLeadDashboard } from './pages/shiftlead/ShiftLeadDashboard';
import { NotFound } from './pages/NotFound';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();
  let page: React.ReactNode;
  switch (pathname) {
    case '/': page = <Layout><Home /></Layout>; break;
    case '/how-it-works': page = <Layout><HowItWorks /></Layout>; break;
    case '/story': page = <Layout><Story /></Layout>; break;
    case '/sign-up': page = <Layout><SignUp /></Layout>; break;
    case '/login': page = <Login />; break;
    case '/extract': page = <RequireAuth><Extract /></RequireAuth>; break;
    case '/clerk-login': page = <ClerkLogin />; break;
    case '/nurse-login': page = <NurseLogin />; break;
    case '/shiftlead-login': page = <ShiftLeadLogin />; break;
    case '/visits': page = <RequireAuth role="clerk"><ClerkDashboard /></RequireAuth>; break;
    case '/triage': page = <RequireAuth role="nurse"><NurseDashboard /></RequireAuth>; break;
    case '/review': page = <RequireAuth role="shift_lead"><ShiftLeadDashboard /></RequireAuth>; break;
    default: page = <Layout><NotFound /></Layout>;
  }
  return <AuthProvider>{page}</AuthProvider>;
}
