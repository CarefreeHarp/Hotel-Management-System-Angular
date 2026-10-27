import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, catchError, forkJoin, of, switchMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { PanelCounts } from '../../models/panel-counts';
import { AdministratorService } from '../../services/administrator.service';
import { PanelService } from '../../services/panel.service';
import { basePath } from '../../utils/base-path';
import { errorPageCode, showErrorPage } from '../../utils/error-page';

// Las propiedades terminadas en Key guardan claves de traducción.
interface PanelCard {
  key: keyof PanelCounts;
  titleKey: string;
  descriptionKey: string;
  path: string;
  createLabelKey?: string;
}

/** Carga los totales del panel. Los servicios HTTP se encargan de consultar el backend. */
@Component({
  selector: 'app-admin-panel',
  imports: [SkeletonComponent, RouterLink, ButtonComponent, AdminHeaderComponent, TranslocoPipe],
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
      titleKey: 'adminHeader.sections.reservations',
      descriptionKey: 'adminPanel.cards.reservations',
      path: 'reservations',
    },
    {
      key: 'services',
      titleKey: 'adminHeader.sections.services',
      descriptionKey: 'adminPanel.cards.services',
      path: 'services',
      createLabelKey: 'adminPanel.create.service',
    },
    {
      key: 'roomTypes',
      titleKey: 'adminHeader.sections.roomTypes',
      descriptionKey: 'adminPanel.cards.roomTypes',
      path: 'room-types',
      createLabelKey: 'adminPanel.create.roomType',
    },
    {
      key: 'rooms',
      titleKey: 'adminHeader.sections.rooms',
      descriptionKey: 'adminPanel.cards.rooms',
      path: 'rooms',
      createLabelKey: 'adminPanel.create.room',
    },
    {
      key: 'clients',
      titleKey: 'adminHeader.sections.clients',
      descriptionKey: 'adminPanel.cards.clients',
      path: 'clients',
      createLabelKey: 'adminPanel.create.client',
    },
    {
      key: 'administrators',
      titleKey: 'adminHeader.sections.administrators',
      descriptionKey: 'adminPanel.cards.administrators',
      path: 'administrators',
      createLabelKey: 'adminPanel.create.administrator',
    },
    {
      key: 'operators',
      titleKey: 'adminHeader.sections.operators',
      descriptionKey: 'adminPanel.cards.operators',
      path: 'operators',
      createLabelKey: 'adminPanel.create.operator',
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
