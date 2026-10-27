import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  LOCALE_ID,
  NgZone,
  OnChanges,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import type { EChartsOption } from 'echarts';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  AriaComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';
import type { EChartsType } from 'echarts/core';
import { init, registerLocale, use } from 'echarts/core';
import langAR from 'echarts/i18n/langAR-obj.js';
import langES from 'echarts/i18n/langES-obj.js';
import langFR from 'echarts/i18n/langFR-obj.js';
import langPTbr from 'echarts/i18n/langPT-br-obj.js';
import langRU from 'echarts/i18n/langRU-obj.js';
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
// ECharts incluye inglés y chino (EN, ZH). Las demás traducciones de sus textos propios
// (descripción accesible, meses) se registran con el código en mayúsculas que se pasa a init.
// ECharts no trae hebreo: con un código sin registrar (HE) usa sus textos en inglés.
registerLocale('ES', langES);
registerLocale('FR', langFR);
registerLocale('PT', langPTbr);
registerLocale('RU', langRU);
registerLocale('AR', langAR);

/** Gestiona el lienzo y su ciclo de vida. Las opciones y datos pertenecen a la página. */
@Component({
  selector: 'app-analytics-chart',
  templateUrl: './analytics-chart.component.html',
  styleUrl: './analytics-chart.component.scss',
})
export class AnalyticsChartComponent
  implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) options: EChartsOption | undefined;
  @Input({ required: true }) label = '';
  @ViewChild('container') private container?: ElementRef<HTMLDivElement>;
  private readonly zone = inject(NgZone);
  // es-CO → ES, en-US → EN, zh-Hans → ZH, ar → AR.
  private readonly chartLocale = inject(LOCALE_ID).slice(0, 2).toUpperCase();
  private chart: EChartsType | undefined;
  private observer: ResizeObserver | undefined;

  ngAfterViewInit(): void {
    const element = this.container?.nativeElement;
    if (!element) {
      return;
    }
    // El movimiento del puntero no necesita disparar detección de cambios en Angular.
    this.zone.runOutsideAngular(() => {
      this.chart = init(element, undefined, { renderer: 'svg', locale: this.chartLocale });
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
