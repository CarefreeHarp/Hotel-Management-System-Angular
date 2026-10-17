import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { ClientService } from '../../services/client.service';
import { ClientInfoComponent } from './components/client-info/client-info.component';
import { ReservationDetails } from '../../models/booking';
import { ReservationService } from '../../services/reservation.service';
import { ReservationHistoryComponent } from '../../components/reservation-history/reservation-history.component';
import { ClientDetailDTO } from '../../models/dto/client-detail-dto';
import { basePath } from '../../utils/base-path';

@Component({
  selector: 'app-clients-detail',
  imports: [RouterLink, AdminHeaderComponent, PageHeadingComponent, ButtonComponent, ClientInfoComponent, ReservationHistoryComponent],
  templateUrl: './clients-detail.component.html',
  styleUrl: './clients-detail.component.scss',
})
export class ClientsDetailComponent implements OnInit {
  private readonly service = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  readonly base = basePath(this.route);
  private readonly reservationsService=inject(ReservationService);
  reservations:ReservationDetails[]=[];
  historyError='';
  historyLoading=true;
  client: ClientDetailDTO | undefined;
  isLoading = true;
  saved = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.saved = this.route.snapshot.queryParamMap.get('saved') === 'true';
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.isLoading = false;
      return;
    }
    this.reservationsService.history(id).subscribe({next:history=>{this.reservations=history;this.historyLoading=false;},error:()=>{this.historyError='Reservation history could not be loaded.';this.historyLoading=false;}});
    this.service.getById(id).subscribe({
      next: (client) => {
        this.client = client;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }
}
