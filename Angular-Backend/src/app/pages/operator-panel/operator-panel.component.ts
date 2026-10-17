import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { basePath } from '../../utils/base-path';
@Component({ selector: 'app-operator-panel', imports: [AdminHeaderComponent, RouterLink], templateUrl: './operator-panel.component.html', styleUrl: './operator-panel.component.scss' })
export class OperatorPanelComponent {
    readonly base = basePath(inject(ActivatedRoute));
}
