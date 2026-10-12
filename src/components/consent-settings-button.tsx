import type { ButtonHTMLAttributes } from 'react';
import { useConsent } from '../context';

export type ConsentSettingsButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>;

/**
 * Reopens the preferences panel so the visitor can review or withdraw consent
 * at any time. Unstyled, to fit a footer or a menu; pass `className` and
 * `children` to change its look and label.
 */
export function ConsentSettingsButton({ children, onClick, ...props }: ConsentSettingsButtonProps) {
  const { t, openSettings } = useConsent();
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) openSettings();
      }}
    >
      {children ?? t('settingsButton.label')}
    </button>
  );
}
