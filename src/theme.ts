export interface ThemeTokens {
  background: string;
  foreground: string;
  muted: string;
  border: string;
  buttonBackground: string;
  buttonForeground: string;
  buttonBorder: string;
  buttonHoverBackground: string;
  secondaryButtonBackground: string;
  secondaryButtonForeground: string;
  link: string;
  focusRing: string;
  switchOn: string;
  switchOff: string;
  switchThumb: string;
  overlay: string;
  shadow: string;
  radius: string;
  fontFamily: string;
  zIndex: string;
}

export const lightTokens: ThemeTokens = {
  background: '#ffffff',
  foreground: '#1a1d23',
  muted: '#525866',
  border: '#dde1e8',
  buttonBackground: '#1a1d23',
  buttonForeground: '#ffffff',
  buttonBorder: '#1a1d23',
  buttonHoverBackground: '#3a3f4b',
  secondaryButtonBackground: 'transparent',
  secondaryButtonForeground: '#1a1d23',
  link: '#1f5fbf',
  focusRing: '#1f5fbf',
  switchOn: '#1f7a4d',
  switchOff: '#a3a9b5',
  switchThumb: '#ffffff',
  overlay: 'rgba(10, 12, 16, 0.5)',
  shadow: '0 8px 30px rgba(10, 12, 16, 0.18)',
  radius: '12px',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  zIndex: '2147483000',
};

export const darkTokens: ThemeTokens = {
  ...lightTokens,
  background: '#1b1e25',
  foreground: '#eef0f4',
  muted: '#a8afbd',
  border: '#343944',
  buttonBackground: '#eef0f4',
  buttonForeground: '#1b1e25',
  buttonBorder: '#eef0f4',
  buttonHoverBackground: '#c9ced8',
  secondaryButtonForeground: '#eef0f4',
  link: '#8bb8ff',
  focusRing: '#8bb8ff',
  switchOn: '#3fb97a',
  switchOff: '#5a6070',
  switchThumb: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
};

function toVariableName(token: string): string {
  return `--cb-${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function declarations(tokens: ThemeTokens): string {
  return (Object.keys(tokens) as (keyof ThemeTokens)[])
    .map((token) => `${toVariableName(token)}:${tokens[token]};`)
    .join('');
}

const ROOT = '.cb-root';

/**
 * Light values on the root; dark values when the system asks for them unless
 * the theme is forced to light, and always when it is forced to dark.
 */
export function themeCss(overrides: { light?: Partial<ThemeTokens>; dark?: Partial<ThemeTokens> } = {}): string {
  const light = declarations({ ...lightTokens, ...overrides.light });
  const dark = declarations({ ...darkTokens, ...overrides.dark });
  return [
    `${ROOT}{${light}}`,
    `@media (prefers-color-scheme: dark){${ROOT}:not([data-theme="light"]){${dark}}}`,
    `${ROOT}[data-theme="dark"]{${dark}}`,
    componentCss,
  ].join('\n');
}

const componentCss = `
.cb-root{font-family:var(--cb-font-family);color:var(--cb-foreground);font-size:15px;line-height:1.5;}
.cb-root *,.cb-root *::before,.cb-root *::after{box-sizing:border-box;}
.cb-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:var(--cb-z-index);max-width:960px;margin:0 auto;padding:20px;background:var(--cb-background);color:var(--cb-foreground);border:1px solid var(--cb-border);border-radius:var(--cb-radius);box-shadow:var(--cb-shadow);display:flex;flex-direction:column;gap:16px;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow:auto;}
.cb-banner:focus{outline:none;}
.cb-title{margin:0 0 6px;font-size:17px;font-weight:600;line-height:1.3;}
.cb-text{margin:0;color:var(--cb-muted);}
.cb-link{color:var(--cb-link);text-decoration:underline;margin-left:4px;}
.cb-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;}
.cb-button{appearance:none;font:inherit;font-weight:600;min-width:140px;padding:10px 18px;border-radius:calc(var(--cb-radius) - 4px);border:1px solid var(--cb-button-border);background:var(--cb-button-background);color:var(--cb-button-foreground);cursor:pointer;}
.cb-button:hover{background:var(--cb-button-hover-background);}
.cb-button--secondary{background:var(--cb-secondary-button-background);color:var(--cb-secondary-button-foreground);border-color:var(--cb-border);}
.cb-button--secondary:hover{background:var(--cb-secondary-button-background);border-color:var(--cb-foreground);}
.cb-button:focus-visible,.cb-link:focus-visible,.cb-switch input:focus-visible+.cb-switch-track,.cb-close:focus-visible{outline:2px solid var(--cb-focus-ring);outline-offset:2px;}
.cb-overlay{position:fixed;inset:0;z-index:var(--cb-z-index);background:var(--cb-overlay);display:flex;align-items:center;justify-content:center;padding:16px;}
.cb-dialog{width:100%;max-width:560px;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow:auto;background:var(--cb-background);color:var(--cb-foreground);border:1px solid var(--cb-border);border-radius:var(--cb-radius);box-shadow:var(--cb-shadow);padding:24px;display:flex;flex-direction:column;gap:16px;}
.cb-dialog-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.cb-close{appearance:none;font:inherit;font-size:22px;line-height:1;background:transparent;border:0;color:var(--cb-muted);cursor:pointer;padding:4px 8px;border-radius:6px;}
.cb-categories{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;}
.cb-category{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;padding:14px 0;border-top:1px solid var(--cb-border);}
.cb-category-title{margin:0 0 4px;font-size:15px;font-weight:600;}
.cb-category-text{margin:0;color:var(--cb-muted);font-size:14px;}
.cb-always-on{font-size:13px;font-weight:600;color:var(--cb-switch-on);white-space:nowrap;}
.cb-switch{position:relative;display:inline-flex;flex-shrink:0;cursor:pointer;}
.cb-switch input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer;}
.cb-switch-track{width:44px;height:24px;border-radius:999px;background:var(--cb-switch-off);position:relative;transition:background .15s;}
.cb-switch-track::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:var(--cb-switch-thumb);transition:transform .15s;}
.cb-switch input:checked+.cb-switch-track{background:var(--cb-switch-on);}
.cb-switch input:checked+.cb-switch-track::after{transform:translateX(20px);}
@media (max-width:600px){.cb-banner{left:8px;right:8px;bottom:8px;padding:16px;max-height:calc(100vh - 16px);max-height:calc(100dvh - 16px);}.cb-actions{flex-direction:column;}.cb-button{width:100%;}}
.cb-banner.cb-banner--bar{left:0;right:0;bottom:0;max-width:none;margin:0;padding:12px 24px;border:0;border-top:1px solid var(--cb-border);border-radius:0;box-shadow:none;flex-direction:row;align-items:center;gap:24px;max-height:100vh;max-height:100dvh;}
.cb-banner--bar .cb-banner-body{flex:1 1 auto;min-width:0;}
.cb-banner--bar .cb-title{margin:0 0 2px;font-size:15px;}
.cb-banner--bar .cb-text{font-size:14px;}
.cb-banner--bar .cb-actions{flex:0 0 auto;flex-wrap:nowrap;}
.cb-banner--bar .cb-button{min-width:0;padding:8px 16px;white-space:nowrap;}
@media (max-width:600px){.cb-banner.cb-banner--bar{left:0;right:0;bottom:0;padding:12px 16px;flex-direction:column;align-items:stretch;gap:12px;max-height:100vh;max-height:100dvh;}.cb-banner--bar .cb-actions{flex-direction:column;}}
@media (prefers-reduced-motion:reduce){.cb-switch-track,.cb-switch-track::after{transition:none;}}
`;
