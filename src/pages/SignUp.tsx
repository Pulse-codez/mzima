import React, { useMemo, useState } from 'react';
import { useNavigate } from '../router';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { authError, authInput, authLabel } from '../components/auth/styles';
import { CheckCircle2 } from 'lucide-react';

type Role = 'clerk' | 'nurse' | 'lead';
type FieldName = 'name' | 'email' | 'clinic' | 'password';

const roleInfo: Record<Role, { title: string; desc: string; can: string }> = {
  clerk: { title: 'Front desk', desc: 'Registration and queue.', can: 'Register arrivals and view queue order.' },
  nurse: { title: 'Nurse', desc: 'Triage and care coordination.', can: 'Complete triage using fixed categories.' },
  lead: { title: 'Shift lead', desc: 'Review and sign off.', can: 'Approve or reject proposals; every decision is logged.' },
};

function validate(field: FieldName, v: string): string {
  switch (field) {
    case 'name':
      return v.trim().length >= 2 ? '' : 'Enter at least 2 characters.';
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid work email.';
    case 'clinic':
      return v.trim().length >= 2 ? '' : 'Enter your clinic or site name.';
    case 'password':
      return v.length >= 8 ? '' : 'Password must be at least 8 characters.';
  }
}

const checkbox = 'mt-1 h-4 w-4 shrink-0 accent-jungle';

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [roleError, setRoleError] = useState('');

  const [values, setValues] = useState<Record<FieldName, string>>({ name: '', email: '', clinic: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});

  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const [ticketId] = useState(() => 'REQ-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'));

  const { name, email, clinic, password } = values;

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  function setField(field: FieldName, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    // Once a field has been flagged, clear the message as soon as it becomes valid.
    if (touched[field]) setErrors((e) => ({ ...e, [field]: validate(field, value) }));
  }

  function blurValidate(field: FieldName) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validate(field, values[field]) }));
  }

  function detailsValid() {
    return (Object.keys(values) as FieldName[]).every((f) => !validate(f, values[f]));
  }

  // TODO(back-end): wire submitAccessRequest to the access-request API.
  async function submitAccessRequest(payload: { role: Role; name: string; email: string; clinic: string; password: string; ticketId: string }) {
    void payload;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (detailsValid()) setStep(3);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !detailsValid() || !consent1 || !consent2) return;
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

  function fieldProps(field: FieldName) {
    const invalid = !!touched[field] && !!errors[field];
    return {
      value: values[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setField(field, e.target.value),
      onBlur: () => blurValidate(field),
      'aria-invalid': invalid ? (true as const) : undefined,
      'aria-describedby': invalid ? `su-${field}-error` : undefined,
      className: authInput,
    };
  }

  function fieldError(field: FieldName) {
    return touched[field] && errors[field] ? (
      <p className={authError} id={`su-${field}-error`}>
        {errors[field]}
      </p>
    ) : null;
  }

  if (success) {
    return (
      <AuthLayout variant="signup">
        <div className="py-12 text-center" role="status" aria-live="polite">
          <CheckCircle2 className="mx-auto h-14 w-14 text-jungle-hot" aria-hidden="true" />
          <h1 className="mt-6 font-helvetica text-4xl tracking-[-0.05em] text-white">Request received</h1>
          <p className="mt-3 text-mist">A shift lead will review it. Ticket {ticketId}.</p>
          <div className="mt-8">
            <Button variant="primary" size="lg" onClick={() => navigate('/')}>
              Back to home
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const stepLabel = `Step ${step} of 3`;

  return (
    <AuthLayout variant="signup">
      <div className="mb-8 flex gap-2" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1 flex-1 ${step >= i ? 'bg-jungle' : 'bg-white/25'}`} />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{stepLabel}</p>

      {step === 1 && (
        <>
          <h1 className="font-helvetica text-[40px] leading-[1.1] tracking-[-0.05em] text-white">Choose your role</h1>
          <p className="mt-3 text-mist">Pick the part you play. Patient access is not offered here.</p>
          <div className="mt-6 grid gap-3" role="group" aria-label="Role">
            {(Object.keys(roleInfo) as Role[]).map((r) => (
              <button
                type="button"
                key={r}
                aria-pressed={role === r}
                onClick={() => { setRole(r); setRoleError(''); }}
                className={`border p-5 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jungle-hot ${
                  role === r
                    ? 'border-jungle bg-jungle/15'
                    : 'border-white/40 bg-forest [@media(hover:hover)_and_(pointer:fine)]:hover:border-white'
                }`}
              >
                <span className="font-helvetica text-xl tracking-[-0.03em] text-white">{roleInfo[r].title}</span>
                <span className="mt-1 block text-sm text-mist">{roleInfo[r].desc}</span>
                <span className="mt-2 block text-sm text-mist"><strong className="font-medium text-white">Can do:</strong> {roleInfo[r].can}</span>
              </button>
            ))}
          </div>
          {roleError && <p className={authError} role="alert">{roleError}</p>}
          <div className="mt-8">
            <Button
              variant="primary"
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
        <form onSubmit={handleDetailsSubmit} className="space-y-5" noValidate>
          <h1 className="font-helvetica text-[40px] leading-[1.1] tracking-[-0.05em] text-white">Your details</h1>
          <div>
            <label htmlFor="su-name" className={authLabel}>Name</label>
            <input id="su-name" autoComplete="name" {...fieldProps('name')} />
            {fieldError('name')}
          </div>
          <div>
            <label htmlFor="su-email" className={authLabel}>Work email</label>
            <input id="su-email" type="email" autoComplete="email" {...fieldProps('email')} />
            {fieldError('email')}
          </div>
          <div>
            <label htmlFor="su-clinic" className={authLabel}>Clinic or site name</label>
            <input id="su-clinic" autoComplete="organization" {...fieldProps('clinic')} />
            {fieldError('clinic')}
          </div>
          <div>
            <label htmlFor="su-password" className={authLabel}>Password</label>
            <div className="relative">
              <input
                id="su-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...fieldProps('password')}
                className={`${authInput} pr-20`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
                className="absolute right-1 top-1/2 min-h-[44px] -translate-y-1/2 px-3 font-tight text-sm font-medium text-forest-deep/80 transition-colors duration-200 hover:bg-forest-deep/10 hover:text-forest-deep focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-forest-deep"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldError('password')}
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`h-1 flex-1 ${strength >= i ? 'bg-jungle' : 'bg-white/25'}`} />
              ))}
            </div>
            <p className="mt-2 text-sm text-mist">Strength: {strength <= 1 ? 'Weak' : strength <= 3 ? 'Fair' : 'Strong'}</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="secondary" size="lg" onClick={() => setStep(1)}>Back</Button>
            <Button type="submit" variant="primary" size="lg" disabled={!detailsValid()}>Continue</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h1 className="font-helvetica text-[40px] leading-[1.1] tracking-[-0.05em] text-white">Review and confirm</h1>
          <dl className="divide-y divide-white/20 border border-white/40 bg-forest p-6">
            {[
              ['Reference', ticketId],
              ['Role', role ? roleInfo[role].title : ''],
              ['Name', name],
              ['Email', email],
              ['Site', clinic],
              ['Status', 'Awaiting review'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3">
                <dt className="text-sm text-mist">{k}</dt>
                <dd className="text-right text-sm font-medium text-white [overflow-wrap:anywhere]">{v}</dd>
              </div>
            ))}
          </dl>
          <label className="flex gap-3 text-sm text-white/90">
            <input type="checkbox" className={checkbox} checked={consent1} onChange={(e) => setConsent1(e.target.checked)} />
            I understand this is a synthetic-data prototype and I will not enter real patient information.
          </label>
          <label className="flex gap-3 text-sm text-white/90">
            <input type="checkbox" className={checkbox} checked={consent2} onChange={(e) => setConsent2(e.target.checked)} />
            I understand access is reviewed by a shift lead.
          </label>
          {formError && <p className={authError} role="alert">{formError}</p>}
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="lg" onClick={() => setStep(2)}>Back</Button>
            <Button type="submit" variant="primary" size="lg" disabled={!consent1 || !consent2 || submitting}>
              {submitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}