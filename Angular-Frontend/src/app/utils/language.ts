/**
 * Idiomas de la interfaz. Cada uno tiene su archivo public/i18n/<code>.json.
 * El nombre se muestra en su propio idioma, igual en todas las traducciones.
 */
export interface AppLanguage {
  code: string;
  name: string;
  // Formato de Angular para fechas, números y moneda (pipes date, number y currency).
  locale: string;
  // Dirección de escritura: el árabe y el hebreo se leen de derecha a izquierda.
  dir: 'ltr' | 'rtl';
}

const ENGLISH: AppLanguage = { code: 'en', name: 'English', locale: 'en-US', dir: 'ltr' };

export const LANGUAGES: AppLanguage[] = [
  ENGLISH,
  { code: 'es', name: 'Español', locale: 'es-CO', dir: 'ltr' },
  { code: 'fr', name: 'Français', locale: 'fr', dir: 'ltr' },
  { code: 'pt', name: 'Português', locale: 'pt', dir: 'ltr' },
  { code: 'zh', name: '简体中文', locale: 'zh-Hans', dir: 'ltr' },
  { code: 'ru', name: 'Русский', locale: 'ru', dir: 'ltr' },
  { code: 'ar', name: 'العربية', locale: 'ar', dir: 'rtl' },
  { code: 'he', name: 'עברית', locale: 'he', dir: 'rtl' },
];

// Idioma de respaldo: una clave que falte en otro idioma se muestra en inglés.
export const DEFAULT_LANGUAGE = ENGLISH.code;

const STORAGE_KEY = 'atlan-language';

/** Idioma guardado en este navegador. Sin uno válido, o con el almacenamiento bloqueado, inglés. */
export function savedLanguage(): AppLanguage {
  let code: string | null = null;
  try {
    code = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Navegación privada o almacenamiento bloqueado: se usa el idioma por defecto.
  }
  return LANGUAGES.find((language) => language.code === code) ?? ENGLISH;
}

/**
 * Guarda la elección y recarga la página: textos, fechas y montos se arman con el
 * nuevo idioma desde el arranque. localStorage solo guarda esta preferencia.
 */
export function changeLanguage(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    return;
  }
  location.reload();
}
