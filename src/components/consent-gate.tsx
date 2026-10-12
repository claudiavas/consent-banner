import type { ReactNode } from 'react';
import { useConsent } from '../context';

export interface ConsentGateProps {
  category: string;
  children: ReactNode;
  /** Rendered while the category is not granted. Default nothing. */
  fallback?: ReactNode;
}

/**
 * Renders its children only once the category is granted: the basis of Consent
 * Mode's basic implementation, where no Google tag loads before consent. A
 * script that already ran cannot be unloaded, so a withdrawal takes full effect
 * on the next page load; the Consent Mode update covers the current one.
 */
export function ConsentGate({ category, children, fallback = null }: ConsentGateProps) {
  const { isGranted } = useConsent();
  return <>{isGranted(category) ? children : fallback}</>;
}
