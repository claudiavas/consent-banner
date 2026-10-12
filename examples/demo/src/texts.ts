export type Locale = 'en' | 'es';

const en = {
  'page.title': 'consent-banner demo',
  'page.intro':
    'A live playground for @claudiavas/consent-banner. Switch the language and the theme, decide on the banner, then reopen the preferences at any time.',
  'controls.heading': 'Settings',
  'controls.locale': 'Language',
  'controls.locale.en': 'English',
  'controls.locale.es': 'Spanish',
  'controls.theme': 'Theme',
  'controls.theme.system': 'System',
  'controls.theme.light': 'Light',
  'controls.theme.dark': 'Dark',
  'controls.reset': 'Forget my decision',
  'status.heading': 'Current decision',
  'status.undecided': 'No decision yet. The banner is waiting for you.',
  'status.granted': 'granted',
  'status.denied': 'denied',
  'gate.heading': 'ConsentGate example',
  'gate.loaded': 'The analytics widget is loaded because analytics cookies are allowed.',
  'gate.blocked': 'This analytics widget stays unloaded until analytics cookies are allowed.',
  'footer.note': 'Withdraw or change your consent at any time:',
} as const;

export type DemoTextKey = keyof typeof en;

const es: Record<DemoTextKey, string> = {
  'page.title': 'Demo de consent-banner',
  'page.intro':
    'Un banco de pruebas de @claudiavas/consent-banner. Cambia el idioma y el tema, decide en el banner y vuelve a abrir las preferencias cuando quieras.',
  'controls.heading': 'Ajustes',
  'controls.locale': 'Idioma',
  'controls.locale.en': 'Inglés',
  'controls.locale.es': 'Español',
  'controls.theme': 'Tema',
  'controls.theme.system': 'Sistema',
  'controls.theme.light': 'Claro',
  'controls.theme.dark': 'Oscuro',
  'controls.reset': 'Olvidar mi decisión',
  'status.heading': 'Decisión actual',
  'status.undecided': 'Aún no hay decisión. El banner te está esperando.',
  'status.granted': 'aceptada',
  'status.denied': 'rechazada',
  'gate.heading': 'Ejemplo de ConsentGate',
  'gate.loaded': 'El widget de analítica se ha cargado porque las cookies de analítica están permitidas.',
  'gate.blocked': 'Este widget de analítica no se carga hasta que se permitan las cookies de analítica.',
  'footer.note': 'Retira o cambia tu consentimiento cuando quieras:',
};

const dictionaries: Record<Locale, Record<DemoTextKey, string>> = { en, es };

export function createDemoTexts(locale: Locale) {
  return (key: DemoTextKey): string => dictionaries[locale][key];
}
