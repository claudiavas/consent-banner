import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useConsent } from '../context';
import { NECESSARY_CATEGORY, type ConsentChoices } from '../types';
import { ThemeRoot } from './theme-root';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Second layer: a modal dialog with one switch per optional category. Focus
 * moves into it on open, stays trapped while open and returns to the element
 * that opened it on close. Escape closes it without saving.
 */
export function ConsentPreferences() {
  const { t, choices, config, save, acceptAll, rejectAll, closeSettings } = useConsent();
  const [draft, setDraft] = useState<ConsentChoices>(choices);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Captured during the first render: by the time effects run, the banner is already
  // inert and the browser has moved focus away from the button that opened the panel.
  const [opener] = useState(() =>
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );

  useEffect(() => {
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialogRef.current)?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [opener]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeSettings();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <ThemeRoot>
      <div className="cb-overlay" onMouseDown={(event) => event.target === event.currentTarget && closeSettings()}>
        <div
          ref={dialogRef}
          className="cb-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          onKeyDown={onKeyDown}
        >
          <div className="cb-dialog-header">
            <h2 id={titleId} className="cb-title">
              {t('preferences.title')}
            </h2>
            <button
              type="button"
              className="cb-close"
              aria-label={t('preferences.actions.close')}
              title={t('preferences.actions.close')}
              onClick={closeSettings}
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p id={descriptionId} className="cb-text">
            {t('preferences.description')}
            {config.policyUrl && (
              <a className="cb-link" href={config.policyUrl}>
                {t('banner.policyLink')}
              </a>
            )}
          </p>
          <ul className="cb-categories">
            {config.categoryIds.map((id) => (
              <CategoryRow
                key={id}
                id={id}
                checked={id === NECESSARY_CATEGORY || draft[id] === true}
                onChange={(checked) => setDraft((current) => ({ ...current, [id]: checked }))}
              />
            ))}
          </ul>
          <div className="cb-actions">
            <button type="button" className="cb-button" onClick={rejectAll}>
              {t('preferences.actions.rejectAll')}
            </button>
            <button type="button" className="cb-button" onClick={acceptAll}>
              {t('preferences.actions.acceptAll')}
            </button>
            <button type="button" className="cb-button" onClick={() => save(draft)}>
              {t('preferences.actions.save')}
            </button>
          </div>
        </div>
      </div>
    </ThemeRoot>
  );
}

function CategoryRow({ id, checked, onChange }: { id: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const { t } = useConsent();
  const titleId = useId();
  const descriptionId = useId();
  const required = id === NECESSARY_CATEGORY;

  return (
    <li className="cb-category">
      <div>
        <h3 id={titleId} className="cb-category-title">
          {t(`categories.${id}.title`)}
        </h3>
        <p id={descriptionId} className="cb-category-text">
          {t(`categories.${id}.description`)}
        </p>
      </div>
      {required ? (
        <span className="cb-always-on">{t('preferences.alwaysOn')}</span>
      ) : (
        <label className="cb-switch">
          <input
            type="checkbox"
            role="switch"
            checked={checked}
            aria-checked={checked}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span className="cb-switch-track" aria-hidden="true" />
        </label>
      )}
    </li>
  );
}
