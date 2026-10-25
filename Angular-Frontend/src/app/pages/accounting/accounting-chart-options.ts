import type { EChartsOption } from 'echarts';
import { AccountingDashboard } from '../../models/accounting';

export interface AccountingCharts {
  statuses: EChartsOption;
  trend: EChartsOption;
  roomTypes: EChartsOption;
  services: EChartsOption;
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'CHECKED_IN':
      return 'In progress';
    default:
      return status;
  }
}

const colors = ['#c39858', '#467e88', '#42765b', '#8780a0', '#be6c67'];
const base: EChartsOption = {
  color: colors,
  textStyle: { fontFamily: 'Inter, Arial, sans-serif', color: '#40545c' },
  aria: { enabled: true, decal: { show: true } },
  // richText dibuja la ayuda en el gráfico. Los conceptos del catálogo no se interpretan como HTML.
  tooltip: { trigger: 'axis', renderMode: 'richText', confine: true },
  toolbox: {
    right: 0,
    feature: {
      restore: { title: 'Reset view' },
      saveAsImage: { title: 'Download chart' },
    },
  },
};

/** Convierte los agregados en opciones de presentación. No calcula estadísticas de negocio. */
export function buildAccountingCharts(
  data: AccountingDashboard,
): AccountingCharts {
  const total = data.statuses.reduce((sum, item) => sum + item.reservations, 0);
  return {
    statuses: {
      ...base,
      tooltip: {
        trigger: 'item',
        renderMode: 'richText',
        confine: true,
        formatter: '{b}: {c} ({d}%)',
      },
      legend: { bottom: 0, type: 'scroll', textStyle: { color: '#40545c' } },
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '38%',
          style: {
            text: String(total),
            fill: '#183238',
            font: '600 36px Inter',
          },
        },
        {
          type: 'text',
          left: 'center',
          top: '51%',
          style: { text: 'reservations', fill: '#677b81', font: '12px Inter' },
        },
      ],
      series: [
        {
          name: 'Reservations',
          type: 'pie',
          radius: ['50%', '72%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          stillShowZeroSum: false,
          selectedMode: 'single',
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 3,
          },
          label: { show: false },
          emphasis: {
            scaleSize: 8,
            label: { show: true, formatter: '{b}\n{d}%', fontWeight: 'bold' },
          },
          data: data.statuses.map((item) => ({
            name: statusLabel(item.status),
            value: item.reservations,
          })),
        },
      ],
    },
    trend: {
      ...base,
      grid: { left: 45, right: 20, top: 45, bottom: 85 },
      xAxis: {
        type: 'category',
        data: data.trend.map((item) => item.date),
        boundaryGap: false,
        axisLabel: { hideOverlap: true },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
      },
      dataZoom: [
        { type: 'inside', filterMode: 'none' },
        {
          type: 'slider',
          bottom: 10,
          height: 24,
          borderColor: '#dce3df',
        },
      ],
      series: [
        {
          name: 'Created reservations',
          type: 'line',
          smooth: 0.2,
          symbolSize: 7,
          areaStyle: { opacity: 0.12 },
          lineStyle: { width: 3 },
          data: data.trend.map((item) => item.reservations),
        },
      ],
    },
    roomTypes: {
      ...base,
      legend: { bottom: 0, textStyle: { color: '#40545c' } },
      grid: { left: 10, right: 25, top: 45, bottom: 55, containLabel: true },
      xAxis: {
        type: 'value',
        minInterval: 1,
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: data.roomTypes.map((item) => item.name),
        axisLabel: { width: 125, overflow: 'truncate' },
      },
      series: [
        {
          name: 'Reservations',
          type: 'bar',
          data: data.roomTypes.map((item) => item.reservations),
          barMaxWidth: 16,
        },
        {
          name: 'Booked nights',
          type: 'bar',
          data: data.roomTypes.map((item) => item.nights),
          barMaxWidth: 16,
        },
      ],
    },
    services: {
      ...base,
      grid: { left: 10, right: 30, top: 40, bottom: 15, containLabel: true },
      xAxis: {
        type: 'value',
        minInterval: 1,
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: data.services.map((item) => item.name),
        axisLabel: { width: 125, overflow: 'truncate' },
      },
      series: [
        {
          name: 'Units contracted',
          type: 'bar',
          barMaxWidth: 20,
          itemStyle: { color: '#467e88', borderRadius: [0, 4, 4, 0] },
          data: data.services.map((item) => item.quantity),
        },
      ],
    },
  };
}
