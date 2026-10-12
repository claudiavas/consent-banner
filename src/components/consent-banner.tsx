import { useId } from 'react';
import { useConsent } from '../context';
import { ThemeRoot } from './theme-root';

/**
 * First layer. Accept all and Reject all share the same style on purpose:
 * regulators expect refusing to be as easy and as visible as accepting.
 */
export function ConsentBanner() {
  const { t, acceptAll, rejectAll, openSettings, isSettingsOpen, config } = useConsent();
  const titleId = useId();
  const descriptionId = useId();

  return (
    <ThemeRoot>
      <div
        className="cb-banner"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-hidden={isSettingsOpen || undefined}
      >
        <div>
          <h2 id={titleId} className="cb-title">
            {t('banner.title')}
          </h2>
          <p id={descriptionId} className="cb-text">
            {t('banner.description')}
            {config.policyUrl && (
              <a className="cb-link" href={config.policyUrl}>
                {t('banner.policyLink')}
              </a>
            )}
          </p>
        </div>
        <div className="cb-actions">
          <button type="button" className="cb-button cb-button--secondary" onClick={openSettings}>
            {t('banner.actions.customize')}
          </button>
          <button type="button" className="cb-button" onClick={rejectAll}>
            {t('banner.actions.rejectAll')}
          </button>
          <button type="button" className="cb-button" onClick={acceptAll}>
            {t('banner.actions.acceptAll')}
          </button>
        </div>
      </div>
    </ThemeRoot>
  );
}
