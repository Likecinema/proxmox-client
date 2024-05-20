import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgZone, effect, signal } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexGrid, ApexLegend, ApexPlotOptions, ApexStroke, ApexTooltip, ApexXAxis, ApexYAxis, NgApexchartsModule } from 'ng-apexcharts';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { ApiService, INodeInfo, INodeMetric } from '../api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NzLayoutModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  public readonly nodeInfos = signal<INodeInfo[]>([]);
  public readonly nodeMetrics = signal<Map<string, INodeMetric[]>>(new Map());
  public constructor(
    private readonly api: ApiService,
    private readonly zone: NgZone
  ) {
    Promise.all([
      this.api.getClusterInfo(),
      this.api.getNodeInfo(),
      this.api.getNodeMetrics('node90'),
      this.api.getNodeResourceInfo('node90', 'vm'),
      this.api.getNodeResourceInfo('node90', 'lxc')
    ])
      .then(r => console.log(r));

    this.loadNodeInfos();

    effect(() => {
      const nodeInfos = this.nodeInfos();

      for (const node of nodeInfos) {
        this.api.getNodeMetrics(node.node)
          .then(metrics => {
            const nodeMetrics = this.nodeMetrics();

            nodeMetrics.set(node.node, metrics);
            this.nodeMetrics.set(new Map(nodeMetrics));
          });
      }
    });
  }
  public getChartInfo(metrics: INodeMetric[]): ChartOptions {
    const opts = this.createChartOptions();

    opts.series[0].name = 'CPU';
    opts.series[0].color = '#008ffb';
    opts.series[0].data = metrics.map(m => m.cpu);
    opts.xaxis.categories = metrics.map(m => m.time);
    opts.yaxis.min = 0;

    return opts;
  }
  private loadNodeInfos() {
    this.api.getNodeInfo().then(nodeInfos => this.nodeInfos.set(nodeInfos));
  }
  private createChartOptions(): ChartOptions {
    return {
      plotOptions: {},
      series: [
        {
          name: 'CPU',
          color: '#54c354',
          data: [11, 32, 45, 32, 34, 52, 41]
        }
      ],
      chart: {
        type: 'area',
        height: 120,
        toolbar: { show: false },
        offsetX: 0,
        offsetY: 0,
        sparkline: {
          enabled: true // This enables sparkline mode which removes all paddings and unnecessary items
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 1
      },
      xaxis: {
        type: 'datetime',
        labels: {
          show: false // Hides the x-axis labels
        },
        axisTicks: {
          show: false // Hides the x-axis ticks
        },
        axisBorder: {
          show: false // Hides the x-axis border
        },
        categories: [
          '2018-09-19T00:00:00.000Z',
          '2018-09-19T01:30:00.000Z',
          '2018-09-19T02:30:00.000Z',
          '2018-09-19T03:30:00.000Z',
          '2018-09-19T04:30:00.000Z',
          '2018-09-19T05:30:00.000Z',
          '2018-09-19T06:30:00.000Z'
        ]
      },
      yaxis: {
        labels: {
          show: false // Hides the y-axis labels
        },
        axisTicks: {
          show: false // Hides the y-axis ticks
        },
        axisBorder: {
          show: false // Hides the y-axis border
        }
      },
      tooltip: {
      },
      grid: {
        show: false, // Hides the grid lines,
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      },
      legend: {
        show: false // Hides the legend (series selection buttons)
      }
    };
  }
}

type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
};
