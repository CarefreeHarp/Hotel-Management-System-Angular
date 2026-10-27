// Las propiedades que terminan en Key guardan una clave de traducción. la plantilla aplica el pipe transloco.
export interface ListOption {
  value: string;
  // Texto ya traducido o un dato, por ejemplo el nombre de un tipo de habitación.
  label: string;
}
export interface SortOption {
  value: string;
  labelKey: string;
}
export interface ListFilter {
  key: string;
  labelKey: string;
  options?: ListOption[];
  type?: 'number' | 'date';
}
export interface ListState {
  search: string;
  filters: Record<string, string>;
  sort: string;
  view: 'table' | 'cards';
}
export function initialListState(view: 'table' | 'cards' = 'table'): ListState {
  return { search: '', filters: {}, sort: 'id-asc', view };
}
/** La misma búsqueda se aplica a identificadores y textos, ignorando espacios externos y mayúsculas. */
export function matchesSearch(
  search: string,
  values: (string | number | undefined)[],
): boolean {
  const term = search.trim().toLocaleLowerCase();
  if (!term) {
    return true;
  }
  for (const value of values) {
    const candidate = String(value ?? '').toLocaleLowerCase();
    if (candidate.includes(term)) {
      return true;
    }
  }
  return false;
}
export function priceMatches(price: number, state: ListState): boolean {
  const min = state.filters['minPrice'];
  const max = state.filters['maxPrice'];
  return (!min || price >= Number(min)) && (!max || price <= Number(max));
}
export const defaultSortOptions: SortOption[] = [
  { value: 'id-asc', labelKey: 'list.sort.idAsc' },
  { value: 'id-desc', labelKey: 'list.sort.idDesc' },
  { value: 'name-asc', labelKey: 'list.sort.nameAsc' },
  { value: 'name-desc', labelKey: 'list.sort.nameDesc' },
];
/** El sufijo controla la dirección. El prefijo elige entre nombre e identificador. */
export function compareRecords(
  sort: string,
  aId: number,
  bId: number,
  aName: string,
  bName: string,
): number {
  const direction = sort.endsWith('-desc') ? -1 : 1;
  if (sort.startsWith('name-')) {
    return direction * aName.localeCompare(bName);
  }
  return direction * (aId - bId);
}
