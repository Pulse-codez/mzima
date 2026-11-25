import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from '../../router';
import { PasswordField } from './PasswordField';
import { useAuth } from '../../auth/AuthContext';
import { AuthFailure } from '../../auth/api';
import { Button } from '../ui/Button';
import { CheckCircle2 } from 'lucide-react';
import { authError, authInput, authLabel } from './styles';

function roleHome(role: string | undefined): string {
  if (role === 'clerk') return '/visits';
  if (role === 'nurse') return '/triage';
  if (role === 'shift_lead') return '/review';
  return '/visits';
}

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({});
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const disabled = submitting || success || cooldown > 0;

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  function validateField(field: 'username' | 'password', value: string) {
    if (!value.trim()) return field === 'username' ? 'Enter your username.' : 'Enter your password.';
    return '';
  }

  function usernameBlur() {
    setTouched((t) => ({ ...t, username: true }));
    setErrors((e) => ({ ...e, username: validateField('username', username) }));
  }

  function passwordBlur() {
    setTouched((t) => ({ ...t, password: true }));
    setErrors((e) => ({ ...e, password: validateField('password', password) }));
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (disabled) return;

      const uErr = validateField('username', username);
      const pErr = validateField('password', password);
      setTouched({ username: true, password: true });
      setErrors({ username: uErr, password: pErr });
      if (uErr || pErr) return;

      setSubmitting(true);
      setFormError(null);
      try {
        const user = await login(username, password);
        setSuccess(true);
        const queryFrom = location.query.from;
        const pendingFrom = Array.isArray(queryFrom) ? queryFrom[0] : queryFrom;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.setTimeout(
          () => navigate(pendingFrom ? pendingFrom : roleHome(user.role), { replace: true }),
          reduceMotion ? 150 : 700,
        );
      } catch (err) {
        if (err instanceof AuthFailure) {
          if (err.kind === 'credentials') {
            setFormError(err.message);
            setPassword('');
            setErrors((e) => ({ ...e, password: '' }));
          } else if (err.kind === 'rateLimited') {
            setFormError(err.message);
            const seconds = err.retryAfter && err.retryAfter > 0 ? err.retryAfter : 120;
            setCooldown(seconds);
          } else {
            setFormError(err.message);
          }
        } else {
          setFormError("We can't reach the server right now. Please try again.");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [disabled, username, password, login, location.query.from, navigate],
  );

  if (success) {
    return (
      <div className="py-12 text-center" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto h-14 w-14 text-jungle-hot" aria-hidden="true" />
        <h2 className="mt-6 font-helvetica text-3xl tracking-[-0.04em] text-white">Signed in</h2>
        <p className="mt-2 text-mist">Taking you to your workspace.</p>
      </div>
    );
  }

  const usernameInvalid = !!touched.username && !!errors.username;

  return (
    <>
      <h1 className="font-helvetica text-[40px] leading-[1.1] tracking-[-0.05em] text-white">Welcome back</h1>
      <p className="mt-3 text-mist">Sign in to continue to your workspace.</p>

      {formError && (
        <div className="mt-6 border-l-4 border-[#FF8A75] bg-forest p-4" role="alert">
          <p className="font-tight text-sm font-medium text-white">{formError}</p>
          {cooldown > 0 && <p className="mt-1 text-sm text-mist">You can try again in {cooldown}s.</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="login-username" className={authLabel}>
            Username
          </label>
          <input
            id="login-username"
            type="text"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={usernameBlur}
            aria-invalid={usernameInvalid ? true : undefined}
            aria-describedby={usernameInvalid ? 'login-username-error' : undefined}
            disabled={disabled}
            placeholder="Enter your username"
            className={authInput}
          />
          {usernameInvalid && (
            <p className={authError} id="login-username-error">
              {errors.username}
            </p>
          )}
        </div>

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          onBlur={passwordBlur}
          touched={touched.password}
          error={errors.password}
          describedBy={touched.password && errors.password ? 'login-password-error' : undefined}
          disabled={disabled}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 font-tight text-mist">
            <input type="checkbox" className="h-4 w-4 accent-[#29AB87]" />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => setShowForgot((s) => !s)}
            aria-expanded={showForgot}
            className="min-h-[44px] font-tight text-sm font-medium text-white underline underline-offset-4 transition-colors duration-200 hover:text-jungle-hot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jungle-hot"
          >
            Forgot password?
          </button>
        </div>

        {showForgot && (
          <p className="border border-white/40 bg-forest p-3 text-sm text-mist" role="status">
            Ask your shift lead to reset your access.
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={disabled} className="w-full">
          {submitting ? 'Signing in…' : cooldown > 0 ? 'Please wait…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-mist">
        Need access?{' '}
        <Link to="/sign-up" className="font-medium text-white underline underline-offset-4 hover:text-jungle-hot">
          Request it here
        </Link>
      </p>
      <p className="mt-3 text-center font-tight text-xs text-mist">
        Access is issued on site by a shift lead and reviewed before activation.
      </p>
    </>
  );
}