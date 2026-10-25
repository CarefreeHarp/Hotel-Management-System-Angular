import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { init, use } from 'echarts/core';
import type { EChartsType } from 'echarts/core';
import type { EChartsOption } from 'echarts';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  GraphicComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

// Solo se registran los gráficos y controles de esta página. La ruta carga este módulo bajo demanda.
use([
  BarChart,
  LineChart,
  PieChart,
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  GraphicComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent,
  SVGRenderer,
]);

/** Gestiona el lienzo y su ciclo de vida. Las opciones y datos pertenecen a la página. */
@Component({
  selector: 'app-analytics-chart',
  templateUrl: './analytics-chart.component.html',
  styleUrl: './analytics-chart.component.scss',
})
export class AnalyticsChartComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input({ required: true }) options: EChartsOption | undefined;
  @Input({ required: true }) label = '';
  @ViewChild('container') private container?: ElementRef<HTMLDivElement>;
  private readonly zone = inject(NgZone);
  private chart: EChartsType | undefined;
  private observer: ResizeObserver | undefined;

  ngAfterViewInit(): void {
    const element = this.container?.nativeElement;
    if (!element) return;
    // El movimiento del puntero no necesita disparar detección de cambios en Angular.
    this.zone.runOutsideAngular(() => {
      this.chart = init(element, undefined, { renderer: 'svg' });
      this.render();
      this.observer = new ResizeObserver(() => this.chart?.resize());
      this.observer.observe(element);
    });
  }

  ngOnChanges(): void {
    this.zone.runOutsideAngular(() => this.render());
  }

  private render(): void {
    if (this.options) {
      this.chart?.setOption(
        {
          ...this.options,
          animation: !window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches,
        },
        { notMerge: true },
      );
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.chart?.dispose();
  }
}
