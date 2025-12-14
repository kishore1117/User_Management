import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  loading = true;
  metrics: any = null;
  distributions: { [key: string]: any[] } = {};
  ipUtilization = 0;
  lastUpdated = '';
  charts: { [key: string]: Chart } = {};

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadDashboardMetrics();
  }

  ngOnDestroy() {
    Object.values(this.charts).forEach(c => c?.destroy());
  }

  loadDashboardMetrics() {
    this.loading = true;
    this.userService.getDahsboardData().subscribe({
      next: (res: any) => {
        const data = res?.data || {};
        this.metrics = {
          total_users: Number(data.summary?.total_users ?? 0),
          available_ips: Number(data.summary?.available_ips ?? 0),
          reserved_ips: Number(data.summary?.reserved_ips ?? 0)
        };
        this.distributions = {};
        const keys = ['software','department','location','category','warranty','model','cpu_serial','processor','cpu_speed','ram','storage','os','monitor'];
        keys.forEach(key => {
          this.distributions[key] = Array.isArray(data[key]) ? data[key] : [];
        });

        this.ipUtilization =
          this.metrics.total_users === 0
            ? 0
            : Math.round((this.metrics.reserved_ips / this.metrics.total_users) * 100);

        this.lastUpdated = new Date().toLocaleTimeString();

        this.initCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Dashboard error', err);
        this.loading = false;
      }
    });
  }

  initCharts() {
    setTimeout(() => {
      this.createIPStatusChart();
      Object.keys(this.distributions).forEach(key => {
        if (this.distributions[key]?.length) {
          this.createBarChart(key, `${key}Chart`);
        }
      });
    }, 100);
  }

  createIPStatusChart() {
    const canvas = document.getElementById('ipStatusChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.charts['ip']?.destroy();

    this.charts['ip'] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Available', 'Reserved'],
        datasets: [{
          data: [this.metrics.available_ips, this.metrics.reserved_ips],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  createBarChart(key: string, canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    this.charts[key]?.destroy();

    const labels = this.distributions[key].map(item => item.name ?? 'Unknown');
    const values = this.distributions[key].map(item => Number(item.count ?? 0));

    this.charts[key] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Count',
          data: values,
          backgroundColor: '#667eea',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  

}
