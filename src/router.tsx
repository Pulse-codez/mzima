import React from 'react';
import NextLink from 'next/link';
import { useRouter as useNextRouter } from 'next/router';

type LinkProps = Omit<React.ComponentProps<typeof NextLink>, 'href'> & { href?: string; to?: string };

export function Link({ to, href, ...props }: LinkProps) {
  return <NextLink href={to ?? href ?? '/'} {...props} />;
}

export function useNavigate() {
  const router = useNextRouter();
  return React.useCallback((url: string, options?: { replace?: boolean }) => {
    void (options?.replace ? router.replace(url) : router.push(url));
  }, [router]);
}

export function useLocation() {
  const router = useNextRouter();
  return {
    pathname: router.pathname === '/[[...slug]]' ? router.asPath.split('?')[0] : router.pathname,
    query: router.query as Record<string, string | string[] | undefined>,
  };
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  React.useEffect(() => navigate(to, { replace }), [navigate, replace, to]);
  return null;
}
