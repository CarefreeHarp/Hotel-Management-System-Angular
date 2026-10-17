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

import { adminGuard } from './guards/admin.guard';
import { clientGuard } from './guards/client.guard';
import { ClientProfileComponent } from './pages/client-profile/client-profile.component';
import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';
import { AuthPageComponent } from './pages/auth-page/auth-page.component';
import { ClientServicesListComponent } from './pages/client-services-list/client-services-list.component';
import { ClientServicesDetailComponent } from './pages/client-services-detail/client-services-detail.component';

import { BookNowComponent } from './pages/book-now/book-now.component';
import { ReservationDetailComponent } from './pages/reservation-detail/reservation-detail.component';
import { OperatorPanelComponent } from './pages/operator-panel/operator-panel.component';
import { operatorGuard } from './guards/operator.guard';

export const routes: Routes = [
  // Sitio público, sin sesión.
  { path: '', component: LandingPageComponent },
  { path: 'login', component: AuthPageComponent },
  { path: 'register', component: AuthPageComponent },
  { path: 'services-catalog', component: ClientServicesListComponent },
  { path: 'services-catalog/:id', component: ClientServicesDetailComponent },
  { path: 'client/services', redirectTo: 'services-catalog', pathMatch: 'full' },
  { path: 'client/services/:id', redirectTo: 'services-catalog/:id' },
  { path: 'room-types', component: RoomTypeTablePageComponent },
  { path: 'room-types/:id', component: RoomTypeDetailComponent },

  // Páginas del cliente. La id va en la URL: al recargar, el guard pide ese cliente
  // al backend y la sesión sigue abierta. Las páginas hijas leen :clientId de la ruta padre.
  {
    path: 'client/:clientId',
    canActivate: [clientGuard],
    children: [
      { path: '', component: LandingPageComponent },
      { path: 'profile', component: ClientProfileComponent },
      { path: 'book-now', component: BookNowComponent },
      { path: 'profile/edit', component: ClientsFormComponent, data: { profile: true } },
      { path: 'services-catalog', component: ClientServicesListComponent },
      { path: 'services-catalog/:id', component: ClientServicesDetailComponent },
      { path: 'room-types', component: RoomTypeTablePageComponent },
      { path: 'room-types/:id', component: RoomTypeDetailComponent },
    ],
  },

  // Páginas del administrador, igual que /admin/panel/{id} en la aplicación de Thymeleaf.
  {
    path: 'admin/:adminId',
    canActivate: [adminGuard],
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
      { path: 'administrators/:id/edit', component: AdministratorsFormComponent },
      { path: 'administrators/:id', component: AdministratorsDetailComponent },
      { path: 'operators', component: OperatorsListComponent },
      { path: 'operators/new', component: OperatorsFormComponent },
      { path: 'operators/:id/edit', component: OperatorsFormComponent },
      { path: 'operators/:id', component: OperatorsDetailComponent },
      { path: 'clients', component: ClientsListComponent },
      { path: 'clients/new', component: ClientsFormComponent },
      { path: 'clients/:id/edit', component: ClientsFormComponent },
      { path: 'clients/:id', component: ClientsDetailComponent },
    ],
  },
  { path: 'reservation/:reservationId', component: ReservationDetailComponent },
  { path: 'operator/:operatorId', canActivate:[operatorGuard], children:[
    {path:'',component:OperatorPanelComponent},
    {path:'profile',component:OperatorsDetailComponent},
    {path:'clients',component:ClientsListComponent},
    {path:'clients/new',component:ClientsFormComponent},
    {path:'clients/:id/edit',component:ClientsFormComponent},
    {path:'clients/:id',component:ClientsDetailComponent},
  ]},
  { path: '**', redirectTo: '' },
];
