// Revisa las traducciones de Transloco. Se ejecuta con `make i18n` y dentro de `make check`.
// 1. Todos los archivos de public/i18n tienen exactamente las mismas claves que en.json.
// 2. Toda clave escrita en plantillas y archivos TS existe en en.json, y cada valor de los enums tiene traducción.
// 3. Las plantillas no muestran texto escrito a mano: todo texto visible pasa por el pipe transloco.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const i18nDir = join(root, 'public', 'i18n');
const appDir = join(root, 'src', 'app');
// Atributos con texto que el usuario ve o escucha. Escritos sin [enlace] deben usar el pipe.
// data-label es la etiqueta de cada celda que el CSS muestra en las tablas en pantallas pequeñas.
// data-role es la palabra de fondo de las fichas del personal.
const TEXT_ATTRIBUTES = [
  'aria-label',
  'data-label',
  'data-role',
  'alt',
  'placeholder',
  'title',
  'label',
  'eyebrow',
  'description',
  'hint',
  'error',
];
// Texto que se muestra igual en todos los idiomas: la marca, el código de la moneda y ejemplos de URL o correo.
const ALLOWED_TEXT = new Set(['Atlan Suites', 'COP']);
const LANGUAGE_NEUTRAL = /^(https?:\/\/\S+|\S+@\S+\.\S+)$/;
const problems = [];

const blank = (text) => text.replace(/[^\n]/g, ' ');
const hasLetters = (text) => /\p{L}/u.test(text) && !LANGUAGE_NEUTRAL.test(text.trim());

function flatten(value, prefix, keys) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child !== null && typeof child === 'object') flatten(child, path, keys);
    else keys.set(path, child);
  }
  return keys;
}

function sourceFiles(dir, extension) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path, extension);
    return entry.name.endsWith(extension) ? [path] : [];
  });
}

function report(file, content, index, message) {
  const line = content.slice(0, index).split('\n').length;
  problems.push(`${relative(root, file)}:${line}: ${message}`);
}

// 1. Mismas claves en todos los idiomas, sin textos vacíos.
const languages = new Map();
for (const name of readdirSync(i18nDir).filter((file) => file.endsWith('.json'))) {
  const translation = JSON.parse(readFileSync(join(i18nDir, name), 'utf8'));
  languages.set(name.replace('.json', ''), flatten(translation, '', new Map()));
}
const english = languages.get('en');
for (const [code, keys] of languages) {
  for (const [key, value] of keys) {
    if (typeof value !== 'string' || !value.trim()) problems.push(`public/i18n/${code}.json: "${key}" has no text`);
    if (code !== 'en' && !english.has(key)) problems.push(`public/i18n/${code}.json: "${key}" does not exist in en.json`);
  }
  if (code === 'en') continue;
  for (const key of english.keys()) {
    if (!keys.has(key)) problems.push(`public/i18n/${code}.json: missing "${key}"`);
  }
}

// 2. Claves usadas en el código. Se reconocen por empezar con una sección de en.json, por ejemplo 'frontDesk.title'.
// Un prefijo de clave dinámica ('enums.roomStatus.' + status) debe corresponder a una sección existente.
const sections = new Set([...english.keys()].map((key) => key.split('.')[0]));
const KEY_LITERAL = /['"`]([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9_-]+)*\.?)(?:['"]|\$\{)/g;
for (const file of [...sourceFiles(appDir, '.html'), ...sourceFiles(appDir, '.ts')]) {
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(KEY_LITERAL)) {
    const key = match[1];
    // En las plantillas, [total]="items.length" es una expresión, no un texto.
    const attributeValue = file.endsWith('.html') && match[0][0] === '"' && content[match.index - 1] === '=';
    if (attributeValue || !key.includes('.') || !sections.has(key.split('.')[0])) continue;
    const known = key.endsWith('.') ? [...english.keys()].some((name) => name.startsWith(key)) : english.has(key);
    if (!known) report(file, content, match.index, `unknown translation key "${key}"`);
  }
}

// Cada valor de los enums de models/enums se muestra con ('enums.<enum>.' + valor) | transloco.
// Ejemplo: RoomStatus.CLEANING necesita la clave enums.roomStatus.CLEANING.
for (const file of sourceFiles(join(appDir, 'models', 'enums'), '.ts')) {
  const content = readFileSync(file, 'utf8');
  for (const enumMatch of content.matchAll(/export enum (\w+)\s*\{([^}]*)\}/g)) {
    const section = `enums.${enumMatch[1][0].toLowerCase()}${enumMatch[1].slice(1)}`;
    for (const value of enumMatch[2].matchAll(/=\s*'([^']+)'/g)) {
      if (!english.has(`${section}.${value[1]}`)) {
        report(file, content, enumMatch.index, `missing translation key "${section}.${value[1]}"`);
      }
    }
  }
}

// 3. Texto escrito a mano en las plantillas.
// Quita las expresiones de control (@if (...), @for (...), @let x = ...) y deja solo el texto.
function removeControlFlow(text) {
  let result = text.replace(/@let\s[^;]*;/g, blank);
  const keyword = /@(?:else\s+if|if|for|switch|case|defer|else|empty|default|placeholder|loading|error)\b\s*/g;
  let match;
  while ((match = keyword.exec(result))) {
    let end = match.index + match[0].length;
    if (result[end] === '(') {
      let depth = 0;
      let quote = null;
      for (; end < result.length; end++) {
        const char = result[end];
        if (quote) {
          if (char === quote) quote = null;
        } else if (char === "'" || char === '"') quote = char;
        else if (char === '(') depth++;
        else if (char === ')' && --depth === 0) break;
      }
      end++;
    }
    result = result.slice(0, match.index) + blank(result.slice(match.index, end)) + result.slice(end);
  }
  return result;
}

// Un ":" separa argumentos de pipe (| date: 'MMM d') o la rama final de un ternario (? 'A' : 'B').
// Es argumento de pipe si, fuera de paréntesis ya cerrados, el último "|" va después del último "?".
function isPipeArgument(before) {
  let text = before.replace(/\?\?|\?\.|\|\|/g, '  ');
  while (/\([^()]*\)/.test(text)) text = text.replace(/\([^()]*\)/g, '');
  return text.lastIndexOf('|') > text.lastIndexOf('?');
}

// Literales de una expresión que el usuario vería: no son claves, ni argumentos de pipes o funciones,
// ni comparaciones (status === 'PENDING'). En atributos no visibles solo cuenta el texto con espacios o mayúscula inicial.
function checkExpression(file, content, expression, offset, visible) {
  const literal = /(['"])((?:(?!\1).)*)\1/g;
  let match;
  while ((match = literal.exec(expression))) {
    const value = match[2];
    const before = expression.slice(0, match.index).trimEnd();
    const after = expression.slice(match.index + match[0].length);
    if (!hasLetters(value) || ALLOWED_TEXT.has(value.trim())) continue;
    if (/^\s*\|\s*transloco/.test(after) || /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_-]+)+\.?$/.test(value)) continue;
    if ((before.endsWith(':') && isPipeArgument(before)) || /[!=]==?$/.test(before) || /[,(]$/.test(before)) continue;
    const looksLikeText = /\s/.test(value.trim()) || /^\p{Lu}\p{Ll}/u.test(value);
    if (visible || looksLikeText) report(file, content, offset + match.index, `hardcoded text "${value}"`);
  }
}

function checkTag(file, content, tag, offset) {
  if (tag.startsWith('</')) return;
  const attribute = /(^|\s)([[(]?)([\w.@-]+)([\])]?)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = attribute.exec(tag))) {
    const [, , open, name, , quoted, double, single] = match;
    const value = double ?? single ?? '';
    const valueOffset = offset + match.index + match[0].length - quoted.length + 1;
    const textName = name.replace(/^attr\./, '');
    // Clases y estilos no son texto visible.
    if (/^(class|ngClass|style|ngStyle)(\.|$)/.test(textName)) continue;
    if (!open) {
      if (TEXT_ATTRIBUTES.includes(textName) && hasLetters(value) && !ALLOWED_TEXT.has(value.trim())) {
        report(file, content, valueOffset, `hardcoded ${textName} "${value}"`);
      }
    } else if (open === '[') {
      checkExpression(file, content, value, valueOffset, TEXT_ATTRIBUTES.includes(textName));
    }
  }
}

function checkText(file, content, segment, offset) {
  for (const match of segment.matchAll(/\{\{([\s\S]*?)\}\}/g)) {
    checkExpression(file, content, match[1], offset + match.index + 2, true);
  }
  const text = removeControlFlow(segment.replace(/\{\{[\s\S]*?\}\}/g, blank))
    .replace(/&[a-zA-Z]+;|&#\d+;/g, blank)
    .replace(/[{}]/g, ' ');
  const first = text.search(/\p{L}/u);
  if (first !== -1 && !ALLOWED_TEXT.has(text.trim())) {
    report(file, content, offset + first, `hardcoded text "${text.trim().replace(/\s+/g, ' ').slice(0, 60)}"`);
  }
}

for (const file of sourceFiles(appDir, '.html')) {
  const content = readFileSync(file, 'utf8');
  let index = 0;
  let textStart = 0;
  while (index < content.length) {
    if (content.startsWith('<!--', index)) {
      checkText(file, content, content.slice(textStart, index), textStart);
      const end = content.indexOf('-->', index);
      index = end === -1 ? content.length : end + 3;
      textStart = index;
    } else if (content[index] === '<' && /[a-zA-Z/]/.test(content[index + 1] ?? '')) {
      checkText(file, content, content.slice(textStart, index), textStart);
      let end = index + 1;
      let quote = null;
      for (; end < content.length; end++) {
        const char = content[end];
        if (quote) {
          if (char === quote) quote = null;
        } else if (char === '"' || char === "'") quote = char;
        else if (char === '>') break;
      }
      checkTag(file, content, content.slice(index, end + 1), index);
      index = end + 1;
      textStart = index;
    } else {
      index++;
    }
  }
  checkText(file, content, content.slice(textStart), textStart);
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} translation problem(s). See "Translations" in the README.`);
  process.exit(1);
}
console.log(`Translations OK: ${english.size} keys in ${languages.size} languages.`);
