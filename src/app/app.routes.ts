import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { RoomTypeDetailComponent } from './pages/room-type-detail/room-type-detail.component';
import { RoomTypeFormPageComponent } from './pages/room-type-form-page/room-type-form-page.component';
import { RoomTypeTablePageComponent } from './pages/room-type-table-page/room-type-table-page.component';
import { ServicesListComponent } from './pages/services-list/services-list.component';
import { ServicesDetailComponent } from './pages/services-detail/services-detail.component';
import { ServicesFormComponent } from './pages/services-form/services-form.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'room-types', component: RoomTypeTablePageComponent },
  { path: 'room-types/new', component: RoomTypeFormPageComponent },
  { path: 'room-types/:id/edit', component: RoomTypeFormPageComponent },
  { path: 'room-types/:id', component: RoomTypeDetailComponent },
  { path: 'services', component: ServicesListComponent },
  { path: 'services/new', component: ServicesFormComponent },
  { path: 'services/:id/edit', component: ServicesFormComponent },
  { path: 'services/:id', component: ServicesDetailComponent },
  { path: '**', redirectTo: '' },
];
