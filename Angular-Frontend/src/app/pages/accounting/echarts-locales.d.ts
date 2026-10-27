// ECharts publica sus traducciones como módulos sin tipos. Cada idioma nuevo se declara aquí.
// Inglés y chino vienen incluidos en ECharts y no necesitan declaración.
type EChartsLocale = Parameters<typeof import('echarts/core').registerLocale>[1];

declare module 'echarts/i18n/langES-obj.js' {
  const locale: EChartsLocale;
  export default locale;
}
declare module 'echarts/i18n/langFR-obj.js' {
  const locale: EChartsLocale;
  export default locale;
}
declare module 'echarts/i18n/langPT-br-obj.js' {
  const locale: EChartsLocale;
  export default locale;
}
declare module 'echarts/i18n/langRU-obj.js' {
  const locale: EChartsLocale;
  export default locale;
}
declare module 'echarts/i18n/langAR-obj.js' {
  const locale: EChartsLocale;
  export default locale;
}
