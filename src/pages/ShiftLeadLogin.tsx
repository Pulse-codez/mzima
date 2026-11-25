import React from 'react';
import { RoleLogin } from '../components/auth/RoleLogin';

export default function ShiftLeadLogin() {
  return (
    <RoleLogin
      title="Shift Lead sign in"
      hint="Use your shift lead identifier (S001 to S010). Any password works for now."
      idLabel="Shift Lead identifier"
      idPlaceholder="S001"
      idPrefix="lead"
      submitLabel="Sign in as shift lead"
      redirectTo="/review"
      method="loginShiftLead"
    />
  );
}