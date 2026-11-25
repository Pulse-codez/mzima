import React, { useCallback, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authError, authInput, authLabel } from './styles';

interface PasswordFieldProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  capsLockHint?: boolean;
  placeholder?: string;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  describedBy,
  disabled,
  inputRef,
  capsLockHint = true,
  placeholder = 'Enter your password',
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (capsLockHint) {
        setCapsOn(e.getModifierState ? e.getModifierState('CapsLock') : false);
      }
    },
    [capsLockHint],
  );

  const showError = !!touched && !!error;

  return (
    <div>
      {label && (
        <label htmlFor={id} className={authLabel}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete="current-password"
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKey}
          onKeyUp={handleKey}
          aria-invalid={showError ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          placeholder={placeholder}
          className={`${authInput} pr-14`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-label={show ? 'Hide password' : 'Show password'}
          disabled={disabled}
          className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-forest-deep/70 transition-colors duration-200 hover:bg-forest-deep/10 hover:text-forest-deep focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-forest-deep disabled:opacity-50"
        >
          {show ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {capsLockHint && capsOn && !disabled && (
        <p className="mt-2 font-tight text-sm font-medium text-white" role="status">
          Caps Lock is on
        </p>
      )}
      {showError && (
        <p className={authError} id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}