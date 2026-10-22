export interface ListOption {
  value: string;
  label: string;
}
export interface ListFilter {
  key: string;
  label: string;
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
  if (!term) return true;
  for (const value of values) {
    const candidate = String(value ?? '').toLocaleLowerCase();
    if (candidate.includes(term)) return true;
  }
  return false;
}
export function priceMatches(price: number, state: ListState): boolean {
  const min = state.filters['minPrice'];
  const max = state.filters['maxPrice'];
  return (!min || price >= Number(min)) && (!max || price <= Number(max));
}
export const defaultSortOptions: ListOption[] = [
  { value: 'id-asc', label: 'ID: low to high' },
  { value: 'id-desc', label: 'ID: high to low' },
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
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
