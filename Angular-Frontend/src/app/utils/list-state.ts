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
export function matchesSearch(
  search: string,
  values: (string | number | undefined)[],
): boolean {
  const term = search.trim().toLocaleLowerCase();
  return (
    !term ||
    values.some((value) =>
      String(value ?? '')
        .toLocaleLowerCase()
        .includes(term),
    )
  );
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
export function compareRecords(
  sort: string,
  aId: number,
  bId: number,
  aName: string,
  bName: string,
): number {
  const direction = sort.endsWith('-desc') ? -1 : 1;
  return (
    direction *
    (sort.startsWith('name-') ? aName.localeCompare(bName) : aId - bId)
  );
}
