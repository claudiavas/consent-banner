import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { useConsent } from '../context';
import { ThemeRoot } from './theme-root';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * First layer. Accept all and Reject all share the same style on purpose:
 * regulators expect refusing to be as easy and as visible as accepting.
 */
export function ConsentBanner() {
  const { t, acceptAll, rejectAll, openSettings, isSettingsOpen, config } = useConsent();
  const titleId = useId();
  const descriptionId = useId();
  const bannerRef = useRef<HTMLDivElement>(null);

  // aria-hidden alone leaves the buttons focusable; inert also takes them out of
  // the tab order while the preferences panel is open. Set through the DOM so it
  // works on React 18, which does not know the inert prop. A layout effect lifts
  // inert before the panel's cleanup returns focus to the Customize button.
  useIsomorphicLayoutEffect(() => {
    if (bannerRef.current) bannerRef.current.inert = isSettingsOpen;
  }, [isSettingsOpen]);

  return (
    <ThemeRoot>
      <div
        ref={bannerRef}
        className={config.layout === 'bar' ? 'cb-banner cb-banner--bar' : 'cb-banner'}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-hidden={isSettingsOpen || undefined}
      >
        <div className="cb-banner-body">
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
