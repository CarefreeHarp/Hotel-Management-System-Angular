import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../components/button/button.component';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { AdministratorService } from '../../services/administrator.service';
import { PanelService } from '../../services/panel.service';
import { PanelCounts } from '../../models/panel-counts';
import { basePath } from '../../utils/base-path';

interface PanelCard {
  key: keyof PanelCounts;
  title: string;
  description: string;
  path: string;
  createLabel: string;
}

@Component({
  selector: 'app-admin-panel',
  imports: [RouterLink, ButtonComponent, AdminHeaderComponent],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss',
})
export class AdminPanelComponent implements OnInit {
  private readonly administrators = inject(AdministratorService);
  private readonly route = inject(ActivatedRoute);
  administratorName = '';
  private readonly panelService = inject(PanelService);
  // /admin/:adminId: las tarjetas enlazan a las secciones de este administrador.
  get base(): string {
    return basePath(this.route);
  }

  readonly cards: PanelCard[] = [
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

  // Una sola petición: el backend devuelve solo los totales, no los registros.
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('adminId'));
    if (Number.isSafeInteger(id) && id > 0)
      this.administrators
        .getById(id)
        .subscribe({
          next: (admin) => (this.administratorName = admin.name),
          error: () => (this.administratorName = ''),
        });
    this.panelService.getCounts().subscribe({
      next: (counts) => {
        this.counts = counts;
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      },
    });
  }
}
