import { ActivationStatus } from '../../models/enums/activation-status';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, finalize, map, forkJoin, of, switchMap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { ButtonComponent } from '../../components/button/button.component';
import { RoomFieldsComponent } from './components/room-fields/room-fields.component';
import { RoomService, RoomData } from '../../services/room.service';
import { RoomTypeService } from '../../services/room-type.service';
import { RoomDetailDTO } from '../../models/dto/room-detail-dto';
import { RoomTypeOptionDTO } from '../../models/dto/room-type-option-dto';
import { RoomStatus } from '../../models/enums/room-status';
import { basePath } from '../../utils/base-path';
import { clearApiErrors, showApiErrors } from '../../utils/api-error';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';
import { wholeNumber } from '../../utils/form-validators';

@Component({
  selector: 'app-rooms-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    RoomFieldsComponent,
  ],
  templateUrl: './rooms-form.component.html',
  styleUrl: './rooms-form.component.scss',
})
export class RoomsFormComponent {
  private readonly service = inject(RoomService);
  private readonly roomTypeService = inject(RoomTypeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  get base(): string {
    return basePath(this.route);
  }
  item: RoomDetailDTO | undefined;
  roomTypes: RoomTypeOptionDTO[] = [];
  isCreateMode = true;
  submitted = false;
  loading = true;
  saving = false;
  error = '';
  // Mismos rangos que la entidad Room. Que el número no esté repetido lo revisa el backend:
  // el formulario ya no descarga todas las habitaciones.
  readonly form = new FormGroup({
    activationStatus: new FormControl(ActivationStatus.ACTIVE, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    number: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(9999),
      wholeNumber,
    ]),
    floor: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(200),
      wholeNumber,
    ]),
    status: new FormControl(RoomStatus.AVAILABLE, {
      nonNullable: true,
      validators: [
        Validators.required,
        (control) =>
          Object.values(RoomStatus).includes(control.value)
            ? null
            : { status: true },
      ],
    }),
    roomTypeId: new FormControl<number | null>(null, [Validators.required]),
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const idParam = params.get('id');
          const id = Number(idParam);
          this.isCreateMode = idParam === null;
          this.loading = true;
          this.error = '';
          this.item = undefined;
          this.roomTypes = [];
          this.submitted = false;
          this.form.reset();
          // Una id inválida muestra la pantalla 400; si la carga falla, la que corresponda.
          if (!this.isCreateMode && (!Number.isSafeInteger(id) || id <= 0)) {
            showErrorPage(this.router, this.route, 400);
            return EMPTY;
          }
          // El selector solo necesita id y nombre de cada tipo.
          return forkJoin({
            roomTypes: this.roomTypeService.getOptions(),
            item: this.isCreateMode ? of(undefined) : this.service.getById(id),
          }).pipe(catchErrorPage(this.router, this.route));
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ roomTypes, item }) => {
        this.loading = false;
        this.roomTypes = roomTypes;
        this.item = item;
        if (item)
          this.form.patchValue({
            number: item.number,
            floor: item.floor,
            status: item.status,
            activationStatus: item.activationStatus,
            roomTypeId: item.roomType.roomTypeId,
          });
      });
  }

  save(): void {
    if (this.saving || this.loading || !this.roomTypes.length) return;
    this.submitted = true;
    this.error = '';
    clearApiErrors(this.form);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (
      value.number === null ||
      value.floor === null ||
      value.roomTypeId === null
    )
      return;
    if (!this.roomTypes.some((type) => type.roomTypeId === value.roomTypeId)) {
      this.error = 'Select an existing room type.';
      return;
    }
    if (!this.isCreateMode && !this.item) return;
    const data: RoomData = {
      number: value.number,
      floor: value.floor,
      status: value.status,
      activationStatus: value.activationStatus,
      roomType: { roomTypeId: value.roomTypeId },
    };
    this.saving = true;
    // Las dos peticiones terminan en la id de la habitación guardada.
    const request = this.isCreateMode
      ? this.service.add(data).pipe(map((created) => created.roomId))
      : this.service
          .update(this.item!.roomId, data)
          .pipe(map(() => this.item!.roomId));
    request
      .pipe(
        finalize(() => {
          this.saving = false;
        }),
      )
      .subscribe({
        next: (id) => {
          void this.router.navigate([this.base, 'rooms', id], {
            queryParams: { saved: true },
          });
        },
        // Si el número ya existe (409) o un valor no es válido, el motivo se muestra bajo su campo.
        error: (error: HttpErrorResponse) => {
          this.error = showApiErrors(this.form, error, {
            roomType: 'roomTypeId',
          });
        },
      });
  }
}
