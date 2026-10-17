import { Component, input, output, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ServiceCatalogDTO } from '../../../../models/dto/service-catalog-dto';
@Component({ selector: 'app-booking-services', imports: [CurrencyPipe], templateUrl: './booking-services.component.html', styleUrl: './booking-services.component.scss' })
export class BookingServicesComponent {
    readonly services = input.required<ServiceCatalogDTO[]>();
    readonly initialIds = input.required<number[]>();
    readonly selected = output<number[]>();
    readonly ids = signal<number[]>([]);
    readonly category = signal('all');
    readonly page = signal(0);
    readonly categories = computed(() => ['all', ...new Set(this.services().map(service => service.category))]);
    readonly filtered = computed(() => this.services().filter(service => this.category() === 'all' || service.category === this.category()));
    readonly pageSize = computed(() => Math.max(1, Math.ceil(this.filtered().length / 2)));
    readonly visible = computed(() => this.filtered().slice(this.page() * this.pageSize(), (this.page() + 1) * this.pageSize()));
    readonly cart = computed(() => this.services().filter(service => this.ids().includes(service.serviceId)));
    readonly total = computed(() => this.cart().reduce((sum, service) => sum + service.price, 0));
    ngOnInit(): void { this.ids.set([...this.initialIds()]); }
    filter(value: string): void { this.category.set(value); this.page.set(0); }
    add(id: number): void { if (!this.ids().includes(id))
        this.ids.update(ids => [...ids, id]); }
    remove(id: number): void { this.ids.update(ids => ids.filter(value => value !== id)); }
}
