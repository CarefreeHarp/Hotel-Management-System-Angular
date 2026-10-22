import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, forkJoin, of, switchMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { PanelCounts } from '../../models/panel-counts';
import { AdministratorService } from '../../services/administrator.service';
import { PanelService } from '../../services/panel.service';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';

interface PanelCard {
  key: keyof PanelCounts;
  title: string;
  description: string;
  path: string;
  createLabel?: string;
}

/** Carga los totales del panel. Los servicios HTTP se encargan de consultar el backend. */
@Component({
  selector: 'app-admin-panel',
  imports: [SkeletonComponent, RouterLink, ButtonComponent, AdminHeaderComponent],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss',
})
export class AdminPanelComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly administrators = inject(AdministratorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  administratorName = '';
  private readonly panelService = inject(PanelService);
  // /admin/:adminId: las tarjetas enlazan a las secciones de este administrador.
  get base(): string {
    return basePath(this.route);
  }

  readonly cards: PanelCard[] = [
    {
      key: 'reservations',
      title: 'Reservations',
      description:
        'All guest bookings, dates, room assignments and reservation details.',
      path: 'reservations',
    },
    {
      key: 'services',
      title: 'Services',
      description:
        'Dining, wellness and concierge services shown in the guest catalog.',
      path: 'services',
      createLabel: 'New service',
    },
    {
      key: 'roomTypes',
      title: 'Room Types',
      description:
        'Suite categories, nightly rates, capacity and photo galleries.',
      path: 'room-types',
      createLabel: 'New room type',
    },
    {
      key: 'rooms',
      title: 'Rooms',
      description:
        'Physical rooms, their floor, status and assigned room type.',
      path: 'rooms',
      createLabel: 'New room',
    },
    {
      key: 'clients',
      title: 'Clients',
      description: 'Registered guest accounts and their contact information.',
      path: 'clients',
      createLabel: 'New client',
    },
    {
      key: 'administrators',
      title: 'Administrators',
      description: 'Staff accounts with full access to this admin panel.',
      path: 'administrators',
      createLabel: 'New administrator',
    },
    {
      key: 'operators',
      title: 'Operators',
      description:
        'Front desk staff and the administrator in charge of each one.',
      path: 'operators',
      createLabel: 'New operator',
    },
  ];

  counts: PanelCounts | undefined;
  loading = true;
  loadError = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = Number(params.get('adminId'));
        this.loading = true;
        this.loadError = false;
        this.counts = undefined;
        this.administratorName = '';
        if (!Number.isSafeInteger(id) || id <= 0) {
          showErrorPage(this.router, this.route, 400);
          return EMPTY;
        }
        // El administrador es obligatorio. Si fallan los totales, los enlaces del panel siguen disponibles.
        return forkJoin({
          administrator: this.administrators.getById(id),
          counts: this.panelService.getCounts().pipe(
            catchError(() => {
              this.loadError = true;
              return of(undefined);
            }),
          ),
        }).pipe(catchError((error: unknown) => {
          showErrorPage(this.router, this.route, errorPageCode(error));
          return EMPTY;
        }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ administrator, counts }) => {
      this.administratorName = administrator.name;
      this.counts = counts;
      this.loading = false;
    });
  }
}
