import { Component, Input, OnChanges, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexDataLabels,
  ApexLegend,
  ApexResponsive,
  ApexStroke,
  ApexTooltip,
} from 'ng-apexcharts';
import { AttendanceManagementService } from '../../../services/attendance-management.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  responsive: ApexResponsive[];
  stroke: ApexStroke;
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-attendance-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './attendance-chart.component.html',
  styleUrls: ['./attendance-chart.component.scss'],
})
export class AttendanceChartComponent implements OnInit, OnChanges {
  private readonly attendanceService = inject(AttendanceManagementService);

  @Input() fromDate: Date | null = null;
  @Input() toDate: Date | null = null;

  readonly loading = signal(true);

  chartOptions: ChartOptions = {
    series: [0, 0, 0],
    chart: {
      type: 'donut',
      height: 210,
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    labels: ['Đúng giờ', 'Trễ giờ', 'Vắng mặt'],
    colors: ['var(--brand-400)', 'var(--brand-600)', 'var(--brand-800)'],
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: '58%',
          labels: {
            show: true,
            name: {
              show: false,
            },
            total: {
              show: false,
              showAlways: false,
              label: '',
              fontSize: '20px',
              fontWeight: 700,
              color: '#333',
              formatter: (w) => {
                const series = w.globals.series;
                return `${series[0] ?? 0}%`;
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: true,
      position: 'right',
      fontSize: '14px',
      fontWeight: 600,
      floating: false,
      offsetY: 40,
      labels: { colors: '#444' },
      markers: {
        size: 8,
        shape: 'square',
        offsetX: -4,
      },
      itemMargin: { horizontal: 0, vertical: 6 },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: { height: 180 },
          legend: { position: 'bottom', offsetY: 0, fontSize: '12px' },
        },
      },
    ],
    stroke: {
      width: 3,
      colors: ['#fff'],
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number) => `${val}%`,
      },
    },
  };

  ngOnInit(): void {
    this.loadAttendancePercentages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fromDate'] || changes['toDate']) {
      this.loadAttendancePercentages();
    }
  }

  private loadAttendancePercentages(): void {
    this.loading.set(true);

    this.attendanceService.getAttendancePercentages(this.fromDate, this.toDate).subscribe({
      next: ({ onTime, late, absent }) => {
        this.chartOptions = {
          ...this.chartOptions,
          series: [onTime, late, absent],
        };
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading attendance chart data', err);
        this.loading.set(false);
      },
    });
  }
}
