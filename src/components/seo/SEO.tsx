import React, { useEffect } from 'react';
import { useLocation } from '../../router';
import { updateSEO } from '../../lib/seo';

interface SEOProps {
  title?: string;
  description?: string;
  type?: 'website' | 'webpage';
}

export function SEO({ title, description, type = 'website' }: SEOProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    updateSEO({ title, description, pathname, type });
  }, [title, description, pathname, type]);

  return null;
}
