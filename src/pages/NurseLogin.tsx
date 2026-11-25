import React from 'react';
import { RoleLogin } from '../components/auth/RoleLogin';

export default function NurseLogin() {
  return (
    <RoleLogin
      title="Nurse sign in"
      hint="Use your nurse identifier (N001 to N010). Any password works for now."
      idLabel="Nurse identifier"
      idPlaceholder="N001"
      idPrefix="nurse"
      submitLabel="Sign in as nurse"
      redirectTo="/triage"
      method="loginNurse"
    />
  );
}