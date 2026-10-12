import { useMemo, type ReactNode } from 'react';
import { useConsent } from '../context';
import { themeCss } from '../theme';

export function ThemeRoot({ children }: { children: ReactNode }) {
  const { config } = useConsent();
  const css = useMemo(() => themeCss(config.tokens), [config.tokens]);
  return (
    <div className="cb-root" data-theme={config.theme === 'system' ? undefined : config.theme}>
      <style>{css}</style>
      {children}
    </div>
  );
}
