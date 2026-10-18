import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { RoomTypeDetailComponent } from './pages/room-type-detail/room-type-detail.component';
import { RoomTypeFormPageComponent } from './pages/room-type-form-page/room-type-form-page.component';
import { RoomTypeTablePageComponent } from './pages/room-type-table-page/room-type-table-page.component';
import { ServicesListComponent } from './pages/services-list/services-list.component';
import { ServicesDetailComponent } from './pages/services-detail/services-detail.component';
import { ServicesFormComponent } from './pages/services-form/services-form.component';
import { AdministratorsListComponent } from './pages/administrators-list/administrators-list.component';
import { AdministratorsDetailComponent } from './pages/administrators-detail/administrators-detail.component';
import { AdministratorsFormComponent } from './pages/administrators-form/administrators-form.component';
import { OperatorsListComponent } from './pages/operators-list/operators-list.component';
import { OperatorsDetailComponent } from './pages/operators-detail/operators-detail.component';
import { OperatorsFormComponent } from './pages/operators-form/operators-form.component';

import { ClientsListComponent } from './pages/clients-list/clients-list.component';
import { ClientsDetailComponent } from './pages/clients-detail/clients-detail.component';
import { ClientsFormComponent } from './pages/clients-form/clients-form.component';

import { RoomsListComponent } from './pages/rooms-list/rooms-list.component';
import { RoomsDetailComponent } from './pages/rooms-detail/rooms-detail.component';
import { RoomsFormComponent } from './pages/rooms-form/rooms-form.component';

import { ClientProfileComponent } from './pages/client-profile/client-profile.component';
import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';
import { AuthPageComponent } from './pages/auth-page/auth-page.component';
import { ClientServicesListComponent } from './pages/client-services-list/client-services-list.component';
import { ClientServicesDetailComponent } from './pages/client-services-detail/client-services-detail.component';

import { ReservationDetailComponent } from './pages/reservation-detail/reservation-detail.component';
import { BookNowComponent } from './pages/book-now/book-now.component';

import { ReservationsListComponent } from './pages/reservations-list/reservations-list.component';
import { ReservationFormComponent } from './pages/reservation-form/reservation-form.component';

export const routes: Routes = [
  // Sitio público, sin sesión.
  { path: '', component: LandingPageComponent },
  { path: 'login', component: AuthPageComponent },
  { path: 'services-catalog', component: ClientServicesListComponent },
  { path: 'services-catalog/:id', component: ClientServicesDetailComponent },
  { path: 'room-types/:id', component: RoomTypeDetailComponent },

  { path: 'profile', component: ClientProfileComponent },
  {
    path: 'profile/edit',
    component: ClientsFormComponent,
    data: { profile: true },
  },
  { path: 'book-now', component: BookNowComponent },
  { path: 'reservation/:id', component: ReservationDetailComponent },

  // Páginas del administrador, igual que /admin/panel/{id} en la aplicación de Thymeleaf.
  {
    path: 'admin/:adminId',
    children: [
      { path: '', component: AdminPanelComponent },
      { path: 'room-types', component: RoomTypeTablePageComponent },
      { path: 'room-types/new', component: RoomTypeFormPageComponent },
      { path: 'room-types/:id/edit', component: RoomTypeFormPageComponent },
      { path: 'room-types/:id', component: RoomTypeDetailComponent },
      { path: 'rooms', component: RoomsListComponent },
      { path: 'rooms/new', component: RoomsFormComponent },
      { path: 'rooms/:id/edit', component: RoomsFormComponent },
      { path: 'rooms/:id', component: RoomsDetailComponent },
      { path: 'services', component: ServicesListComponent },
      { path: 'services/new', component: ServicesFormComponent },
      { path: 'services/:id/edit', component: ServicesFormComponent },
      { path: 'services/:id', component: ServicesDetailComponent },
      { path: 'administrators', component: AdministratorsListComponent },
      { path: 'administrators/new', component: AdministratorsFormComponent },
      {
        path: 'administrators/:id/edit',
        component: AdministratorsFormComponent,
      },
      { path: 'administrators/:id', component: AdministratorsDetailComponent },
      { path: 'operators', component: OperatorsListComponent },
      { path: 'operators/new', component: OperatorsFormComponent },
      { path: 'operators/:id/edit', component: OperatorsFormComponent },
      { path: 'operators/:id', component: OperatorsDetailComponent },
      { path: 'reservations', component: ReservationsListComponent },
      { path: 'reservations/:id/edit', component: ReservationFormComponent },
      { path: 'reservations/:id', component: ReservationDetailComponent },
      { path: 'clients', component: ClientsListComponent },
      { path: 'clients/new', component: ClientsFormComponent },
      { path: 'clients/:id/edit', component: ClientsFormComponent },
      { path: 'clients/:id', component: ClientsDetailComponent },
    ],
  },
  {
    path: 'operator/:operatorId',
    children: [
      { path: '', component: OperatorsDetailComponent },
      { path: 'reservations', component: ReservationsListComponent },
      { path: 'reservations/:id/edit', component: ReservationFormComponent },
      { path: 'reservations/:id', component: ReservationDetailComponent },
      { path: 'clients', component: ClientsListComponent },
      { path: 'clients/new', component: ClientsFormComponent },
      { path: 'clients/:id/edit', component: ClientsFormComponent },
      { path: 'clients/:id', component: ClientsDetailComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
