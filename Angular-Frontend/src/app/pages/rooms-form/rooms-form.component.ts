import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { translate, TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, Observable, Subject, catchError, exhaustMap, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { ButtonComponent } from '../../components/button/button.component';
import { PageHeadingComponent } from '../../components/page-heading/page-heading.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { RoomDetailDTO } from '../../models/dto/room-detail-dto';
import { RoomTypeOptionDTO } from '../../models/dto/room-type-option-dto';
import { ActivationStatus } from '../../models/enums/activation-status';
import { RoomStatus } from '../../models/enums/room-status';
import { RoomTypeService } from '../../services/room-type.service';
import { RoomData, RoomService } from '../../services/room.service';
import { clearApiErrors, showApiErrors } from '../../utils/api-error';
import { basePath } from '../../utils/base-path';
import { catchErrorPage, showErrorPage } from '../../utils/error-page';
import { wholeNumber } from '../../utils/form-validators';
import { RoomFieldsComponent } from './components/room-fields/room-fields.component';

/** Coordina la carga y el guardado de habitaciones. Los campos reutilizables reciben el formulario. */
@Component({
  selector: 'app-rooms-form',
  imports: [
    SkeletonComponent,
    ReactiveFormsModule,
    RouterLink,
    AdminHeaderComponent,
    PageHeadingComponent,
    ButtonComponent,
    RoomFieldsComponent,
    TranslocoPipe,
  ],
  templateUrl: './rooms-form.component.html',
  styleUrl: './rooms-form.component.scss',
})
export class RoomsFormComponent {
  private readonly saveSubject = new Subject<void>();
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
    // exhaustMap ignora nuevos envíos mientras termina el guardado actual.
    this.saveSubject.pipe(
      exhaustMap(() => this.saveChanges()),
      takeUntilDestroyed(),
    ).subscribe();

    this.route.paramMap
      .pipe(
        // switchMap descarta la lectura anterior si cambia la ruta para mostrar solo la más reciente.
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
          // Una id inválida muestra la pantalla 400. Si la carga falla, la que corresponda.
          if (!this.isCreateMode && (!Number.isSafeInteger(id) || id <= 0)) {
            showErrorPage(this.router, this.route, 400);
            return EMPTY;
          }
          // El selector solo necesita id y nombre de cada tipo.
          // forkJoin espera que terminen todas estas consultas y entrega sus resultados juntos.
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
    this.saveSubject.next();
  }

  private saveChanges(): Observable<unknown> {
    if (this.saving || this.loading || !this.roomTypes.length) return EMPTY;
    this.submitted = true;
    this.error = '';
    clearApiErrors(this.form);
    this.form.markAllAsTouched();
    if (this.form.invalid) return EMPTY;
    const value = this.form.getRawValue();
    if (
      value.number === null ||
      value.floor === null ||
      value.roomTypeId === null
    )
      return EMPTY;
    if (!this.roomTypes.some((type) => type.roomTypeId === value.roomTypeId)) {
      this.error = translate('rooms.form.selectExistingType');
      return EMPTY;
    }
    const item = this.item;
    if (!this.isCreateMode && !item) return EMPTY;
    const data: RoomData = {
      number: value.number,
      floor: value.floor,
      status: value.status,
      activationStatus: value.activationStatus,
      roomType: { roomTypeId: value.roomTypeId },
    };
    this.saving = true;
    // Las dos peticiones terminan en la id de la habitación guardada.
    const request = item && !this.isCreateMode
      ? this.service.update(item.roomId, data).pipe(map(() => item.roomId))
      : this.service.add(data).pipe(map((created) => created.roomId));
    return request
      .pipe(
        // finalize restablece el estado de guardado tanto si la petición termina bien como si falla.
        finalize(() => {
          this.saving = false;
        }),
      ).pipe(
        tap((id) => {
          void this.router.navigate([this.base, 'rooms', id], {
            queryParams: { saved: true },
          });
        }),
        catchError((error: HttpErrorResponse) => {
          this.error = showApiErrors(this.form, error, {
            roomType: 'roomTypeId',
          });

          return EMPTY;
        }),
      );
    return EMPTY;
  }
}
