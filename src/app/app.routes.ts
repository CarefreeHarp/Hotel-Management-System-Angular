import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { RoomTypeDetailComponent } from './pages/room-type-detail/room-type-detail.component';
import { RoomTypeFormPageComponent } from './pages/room-type-form-page/room-type-form-page.component';
import { RoomTypeTablePageComponent } from './pages/room-type-table-page/room-type-table-page.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'room-types', component: RoomTypeTablePageComponent },
  { path: 'room-types/new', component: RoomTypeFormPageComponent },
  { path: 'room-types/:id/edit', component: RoomTypeFormPageComponent },
  { path: 'room-types/:id', component: RoomTypeDetailComponent },
  { path: '**', redirectTo: '' },
];
