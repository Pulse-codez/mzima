import React from 'react';
import {
  Link as RouterLink,
  useNavigate as useRRNavigate,
  useLocation as useRRLocation,
  Navigate as RRNavigate,
  type LinkProps as RRLinkProps,
} from 'react-router-dom';

type LinkProps = Omit<RRLinkProps, 'to'> & { to?: string; href?: string };

export function Link({ to, href, ...props }: LinkProps) {
  return <RouterLink to={to ?? href ?? '/'} {...props} />;
}

export function useNavigate() {
  const navigate = useRRNavigate();
  return React.useCallback(
    (url: string, options?: { replace?: boolean }) => {
      void navigate(url, { replace: options?.replace });
    },
    [navigate],
  );
}

export function useLocation() {
  const loc = useRRLocation();
  return {
    pathname: loc.pathname,
    query: Object.fromEntries(new URLSearchParams(loc.search)) as Record<string, string>,
  };
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  return <RRNavigate to={to} replace={replace} />;
}
