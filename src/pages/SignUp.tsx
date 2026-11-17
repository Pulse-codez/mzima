import React, { useMemo, useState } from 'react';
import { useNavigate } from '../router';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { authInput, authLabel } from '../components/auth/styles';
import { CheckCircle2 } from 'lucide-react';

type Role = 'clerk' | 'nurse' | 'lead';

const roleInfo: Record<Role, { title: string; desc: string; can: string }> = {
  clerk: { title: 'Front desk', desc: 'Registration and queue.', can: 'Register arrivals and view queue order.' },
  nurse: { title: 'Nurse', desc: 'Triage and care coordination.', can: 'Complete triage using fixed categories.' },
  lead: { title: 'Shift lead', desc: 'Review and sign off.', can: 'Approve or reject proposals; every decision is logged.' },
};

const fieldError = 'mt-2 text-sm font-semibold text-white';

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [roleError, setRoleError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [clinic, setClinic] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{ name?: string; email?: string; clinic?: string; password?: string }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const [ticketId] = useState(() => 'REQ-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'));

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  function validateName(v: string) { return v.trim().length >= 2 ? '' : 'Enter at least 2 characters.'; }
  function validateEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid work email.'; }
  function validateClinic(v: string) { return v.trim().length >= 2 ? '' : 'Enter your clinic or site name.'; }
  function validatePassword(v: string) { return v.length >= 8 ? '' : 'Password must be at least 8 characters.'; }

  function blurValidate(field: string, value: string) {
    setTouched((t) => ({ ...t, [field]: true }));
    let msg = '';
    if (field === 'name') msg = validateName(value);
    if (field === 'email') msg = validateEmail(value);
    if (field === 'clinic') msg = validateClinic(value);
    if (field === 'password') msg = validatePassword(value);
    setErrors((e) => ({ ...e, [field]: msg }));
  }

  function canAdvanceStep2() {
    return !validateName(name) && !validateEmail(email) && !validateClinic(clinic) && !validatePassword(password);
  }

  // TODO(back-end): wire submitAccessRequest to the access-request API.
  async function submitAccessRequest(payload: { role: Role; name: string; email: string; clinic: string; password: string; ticketId: string }) {
    void payload;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !canAdvanceStep2() || !consent1 || !consent2) return;
    setSubmitting(true);
    setFormError('');
    try {
      await submitAccessRequest({ role, name, email, clinic, password, ticketId });
      setSuccess(true);
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <AuthLayout variant="signup">
        <div className="py-12 text-center" role="status" aria-live="polite">
          <CheckCircle2 className="mx-auto h-14 w-14 text-stone-light" aria-hidden="true" />
          <h1 className="mt-6 font-heading text-3xl font-extrabold text-white">Request received</h1>
          <p className="mt-3 text-white/85">A shift lead will review it. Ticket {ticketId}.</p>
          <div className="mt-8">
            <Button variant="solid" size="lg" onClick={() => navigate('/')}>
              Back to home
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const stepLabel = step === 1 ? 'Step 1 of 3' : step === 2 ? 'Step 2 of 3' : 'Step 3 of 3';

  return (
    <AuthLayout variant="signup">
      <div className="mb-8 flex gap-2" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${step >= i ? 'bg-stone-light' : 'bg-stone/30'}`} />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{stepLabel}</p>

      {step === 1 && (
        <>
          <h1 className="font-heading text-3xl font-extrabold text-white">Choose your role</h1>
          <p className="mt-2 text-white/85">Pick the part you play. Patient access is not offered here.</p>
          <div className="mt-6 grid gap-3">
            {(Object.keys(roleInfo) as Role[]).map((r) => (
              <button
                type="button"
                key={r}
                aria-pressed={role === r}
                onClick={() => { setRole(r); setRoleError(''); }}
                className={`lift-hover rounded-2xl border-2 p-5 text-left transition-colors ${
                  role === r ? 'border-white bg-stone/25' : 'border-stone/40 bg-egyptian-deep hover:border-stone'
                }`}
              >
                <span className="font-heading text-lg font-bold text-white">{roleInfo[r].title}</span>
                <span className="mt-1 block text-sm text-white/80">{roleInfo[r].desc}</span>
                <span className="mt-2 block text-sm text-white/80"><strong className="text-white">Can do:</strong> {roleInfo[r].can}</span>
              </button>
            ))}
          </div>
          {roleError && <p className={fieldError} role="alert">{roleError}</p>}
          <div className="mt-8">
            <Button
              variant="scarlet"
              size="lg"
              onClick={() => {
                if (!role) { setRoleError('Choose a role to continue.'); return; }
                setStep(2);
              }}
            >
              Continue
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); if (canAdvanceStep2()) setStep(3); }} className="space-y-5" noValidate>
          <h1 className="font-heading text-3xl font-extrabold text-white">Your details</h1>
          <div>
            <label htmlFor="su-name" className={authLabel}>Name</label>
            <input id="su-name" className={authInput} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => blurValidate('name', name)} />
            {touched.name && errors.name && <p className={fieldError}>{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="su-email" className={authLabel}>Work email</label>
            <input id="su-email" type="email" className={authInput} value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => blurValidate('email', email)} />
            {touched.email && errors.email && <p className={fieldError}>{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="su-clinic" className={authLabel}>Clinic or site name</label>
            <input id="su-clinic" className={authInput} value={clinic} onChange={(e) => setClinic(e.target.value)} onBlur={() => blurValidate('clinic', clinic)} />
            {touched.clinic && errors.clinic && <p className={fieldError}>{errors.clinic}</p>}
          </div>
          <div>
            <label htmlFor="su-password" className={authLabel}>Password</label>
            <div className="relative">
              <input
                id="su-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${authInput} pr-20`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => blurValidate('password', password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 min-h-[36px] -translate-y-1/2 rounded-lg px-3 text-sm font-semibold text-stone-light hover:bg-white/10 hover:text-white"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {touched.password && errors.password && <p className={fieldError}>{errors.password}</p>}
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${strength >= i ? 'bg-stone-light' : 'bg-stone/30'}`} />
              ))}
            </div>
            <p className="mt-2 text-sm text-white/80">Strength: {strength <= 1 ? 'Weak' : strength <= 3 ? 'Fair' : 'Strong'}</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" size="lg" onClick={() => setStep(1)}>Back</Button>
            <Button type="submit" variant="scarlet" size="lg" disabled={!canAdvanceStep2()}>Continue</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h1 className="font-heading text-3xl font-extrabold text-white">Review and confirm</h1>
          <dl className="divide-y divide-stone/30 rounded-2xl border border-stone/40 bg-egyptian-deep p-6">
            {[
              ['Ticket', ticketId],
              ['Role', role ? roleInfo[role].title : ''],
              ['Name', name],
              ['Email', email],
              ['Site', clinic],
              ['Status', 'Awaiting review'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3">
                <dt className="text-sm text-stone-light">{k}</dt>
                <dd className="text-right text-sm font-semibold text-white">{v}</dd>
              </div>
            ))}
          </dl>
          <label className="flex gap-3 text-sm text-white/90">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-white" checked={consent1} onChange={(e) => setConsent1(e.target.checked)} />
            I understand this is a synthetic-data prototype and I will not enter real patient information.
          </label>
          <label className="flex gap-3 text-sm text-white/90">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-white" checked={consent2} onChange={(e) => setConsent2(e.target.checked)} />
            I understand access is reviewed by a shift lead.
          </label>
          {formError && <p className={fieldError} role="alert">{formError}</p>}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep(2)}>Back</Button>
            <Button type="submit" variant="scarlet" size="lg" disabled={!consent1 || !consent2 || submitting}>
              {submitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
