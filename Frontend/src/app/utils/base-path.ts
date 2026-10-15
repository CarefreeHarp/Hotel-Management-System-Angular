import { ActivatedRoute } from '@angular/router';

/**
 * Inicio de las URL de la página actual: /admin/:adminId, /client/:clientId o /
 * en el sitio público. La id sale de la URL, así que los enlaces la conservan
 * aunque se recargue la página.
 */
export function basePath(route: ActivatedRoute): string {
  const params = route.snapshot.paramMap;
  if (params.has('adminId')) return `/admin/${params.get('adminId')}`;
  if (params.has('clientId')) return `/client/${params.get('clientId')}`;
  return '/';
}

/** Las páginas compartidas (tipos de habitación) muestran sus acciones de edición solo bajo /admin/:adminId. */
export function isAdminArea(route: ActivatedRoute): boolean {
  return route.snapshot.paramMap.has('adminId');
}
