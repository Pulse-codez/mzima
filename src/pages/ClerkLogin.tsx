import React from 'react';
import { RoleLogin } from '../components/auth/RoleLogin';

export default function ClerkLogin() {
  return (
    <RoleLogin
      title="Clerk sign in"
      hint="Use your clerk identifier (R001 to R010). Any password works for now."
      idLabel="Clerk identifier"
      idPlaceholder="R001"
      idPrefix="clerk"
      submitLabel="Sign in as clerk"
      redirectTo="/visits"
      method="loginClerk"
      footnote="Prototype access only. Clinicians and shift leads need backend-reviewed accounts. Patients never access this dashboard."
    />
  );
}