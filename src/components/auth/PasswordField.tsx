import React, { useCallback, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authInput } from './styles';

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

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-2 block text-sm font-semibold text-white">
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
          aria-invalid={touched && !!error ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          placeholder={placeholder}
          className={`${authInput} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-label={show ? 'Hide password' : 'Show password'}
          disabled={disabled}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-stone-light hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          {show ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {capsLockHint && capsOn && !disabled && (
        <p className="mt-2 text-sm font-semibold text-white" role="status">
          Caps Lock is on
        </p>
      )}
      {touched && error && (
        <p className="mt-2 text-sm font-semibold text-white" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
