import { DOCUMENT, registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  LOCALE_ID,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';
import { DEFAULT_LANGUAGE, LANGUAGES, savedLanguage } from './utils/language';

// Formatos de Angular (fechas, números y moneda) por locale de LANGUAGES. El inglés viene incluido.
// los demás se descargan solo para el idioma elegido, así no pesan en la carga inicial.
const LOCALE_DATA: Record<string, () => Promise<{ default: unknown }>> = {
  'es-CO': () => import('@angular/common/locales/es-CO'),
  fr: () => import('@angular/common/locales/fr'),
  pt: () => import('@angular/common/locales/pt'),
  'zh-Hans': () => import('@angular/common/locales/zh-Hans'),
  ru: () => import('@angular/common/locales/ru'),
  ar: () => import('@angular/common/locales/ar'),
  he: () => import('@angular/common/locales/he'),
};

async function loadLocaleData(locale: string): Promise<void> {
  const loader = LOCALE_DATA[locale];
  if (loader) {
    registerLocaleData((await loader()).default);
  }
}

// Cambiar de idioma recarga la página, así que el idioma se decide una sola vez al arrancar.
const language = savedLanguage();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: LANGUAGES.map((item) => item.code),
        defaultLang: language.code,
        // Si a un idioma le falta una clave, se muestra el texto en inglés en lugar de la clave.
        fallbackLang: DEFAULT_LANGUAGE,
        missingHandler: { useFallbackTranslation: true },
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    // Los pipes date, number y currency toman el formato del idioma elegido.
    { provide: LOCALE_ID, useValue: language.locale },
    // La traducción y los formatos se cargan antes de la primera página: nunca se ven claves sin traducir.
    provideAppInitializer(() => {
      const transloco = inject(TranslocoService);
      const document = inject(DOCUMENT);
      const title = inject(Title);
      return Promise.all([
        firstValueFrom(transloco.load(language.code)),
        loadLocaleData(language.locale),
      ]).then(() => {
        document.documentElement.lang = language.code;
        document.documentElement.dir = language.dir;
        title.setTitle(transloco.translate('app.title'));
      });
    }),
  ],
};
