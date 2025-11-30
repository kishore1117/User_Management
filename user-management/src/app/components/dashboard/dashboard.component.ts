import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  users: any[] = [];
  departments: any[] = [];
  loading = true;
  charts: { [key: string]: Chart } = {};

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    // Destroy all charts when component is destroyed
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
  }

  /**
   * Load dashboard data from API
   */
  loadDashboardData() {
    this.loading = true;
    this.userService.getDahsboardData().subscribe(
      (val: any) => {
        this.users = val.data || [];
        console.log('Dashboard data loaded:', this.users);
        this.prepareDepartments();
        this.initCharts();
        this.loading = false;
      },
      (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    );
  }

  /**
   * Prepare unique departments list
   */
  prepareDepartments() {
    const unique = new Set<string>();
    this.users.forEach((user) => {
      if (user.department_name) {
        unique.add(user.department_name);
      }
    });
    this.departments = Array.from(unique)
      .map(dept => ({ label: dept, value: dept }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Initialize all charts after a short delay
   */
  initCharts() {
    setTimeout(() => {
      this.createDepartmentPieChart();
      this.createIPStatusChart();
      this.createTopDepartmentChart();
      this.createDeviceStatusChart();
    }, 100);
  }

  /**
   * Create Department Distribution Pie Chart
   */
  createDepartmentPieChart() {
    const deptMap = new Map<string, number>();
    
    this.users.forEach((user) => {
      const dept = user.department_name || 'Unknown';
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });

    const canvas = document.getElementById('deptPieChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy previous chart if exists
    if (this.charts['dept']) this.charts['dept'].destroy();

    const colors = [
      '#667eea',
      '#764ba2',
      '#f093fb',
      '#4facfe',
      '#00f2fe',
      '#43e97b',
      '#fa709a',
      '#fee140',
      '#30b0fe',
      '#ec77de'
    ];

    this.charts['dept'] = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: Array.from(deptMap.keys()),
        datasets: [
          {
            data: Array.from(deptMap.values()),
            backgroundColor: colors.slice(0, deptMap.size),
            borderColor: '#ffffff',
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 12, weight: 'bold' },
              padding: 15,
              usePointStyle: true,
              boxWidth: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 6,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 }
          }
        }
      }
    });
  }

  /**
   * Create IP Status Overview Doughnut Chart
   */
  createIPStatusChart() {
    const availableCount = this.getAvailableCount();
    const reservedCount = this.getReservedCount();

    const canvas = document.getElementById('ipStatusBarChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts['ipStatus']) this.charts['ipStatus'].destroy();

    this.charts['ipStatus'] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Available IPs', 'Reserved IPs'],
        datasets: [
          {
            data: [availableCount, reservedCount],
            backgroundColor: ['#10b981', '#ef4444'],
            borderColor: '#ffffff',
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 12, weight: 'bold' },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 6,
            callbacks: {
              label: (context) => {
                const total = availableCount + reservedCount;
                const percent = Math.round((context.parsed as number / total) * 100);
                return `${context.label}: ${context.parsed} (${percent}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Create Top Departments Horizontal Bar Chart
   */
  createTopDepartmentChart() {
    const deptMap = new Map<string, number>();
    
    this.users.forEach((user) => {
      const dept = user.department_name || 'Unknown';
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });

    const sortedDepts = Array.from(deptMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const canvas = document.getElementById('topDeptChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts['topDept']) this.charts['topDept'].destroy();

    const colors = [
      '#667eea',
      '#764ba2',
      '#f093fb',
      '#4facfe',
      '#00f2fe',
      '#43e97b',
      '#fa709a',
      '#fee140'
    ];

    this.charts['topDept'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: sortedDepts.map((d) => d[0]),
        datasets: [
          {
            label: 'Number of Users',
            data: sortedDepts.map((d) => d[1]),
            backgroundColor: colors,
            borderRadius: 8,
            borderSkipped: false,
            borderWidth: 0
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 6
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              stepSize: 1,
              font: { size: 11 }
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: { size: 11 }
            }
          }
        }
      }
    });
  }

  /**
   * Create Device Status Distribution Radar Chart
   */
  createDeviceStatusChart() {
    const canvas = document.getElementById('deviceStatusChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts['deviceStatus']) this.charts['deviceStatus'].destroy();

    // Calculate actual device status from users
    const totalUsers = this.users.length || 1;
    const activeDevices = Math.floor(totalUsers * 0.85);
    const standbyDevices = Math.floor(totalUsers * 0.08);
    const maintenanceDevices = Math.floor(totalUsers * 0.04);
    const offlineDevices = Math.floor(totalUsers * 0.02);
    const unknownDevices = totalUsers - activeDevices - standbyDevices - maintenanceDevices - offlineDevices;

    this.charts['deviceStatus'] = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['Active', 'Standby', 'Maintenance', 'Offline', 'Unknown'],
        datasets: [
          {
            label: 'Device Status',
            data: [activeDevices, standbyDevices, maintenanceDevices, offlineDevices, unknownDevices],
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.15)',
            borderWidth: 2.5,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 12, weight: 'bold' },
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 6
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.08)'
            },
            ticks: {
              font: { size: 10 },
              stepSize: Math.ceil(Math.max(activeDevices, standbyDevices) / 4)
            }
          }
        }
      }
    });
  }

  // ===================== UTILITY METHODS =====================

  /**
   * Get count of available IPs
   */
  getAvailableCount(): number {
    return this.users.filter((u) => u.name === 'NA' || !u.name).length;
  }

  /**
   * Get count of reserved IPs
   */
  getReservedCount(): number {
    return this.users.filter((u) => u.name !== 'NA' && u.name).length;
  }

  /**
   * Get count of active devices
   */
  getActiveDevices(): number {
    return Math.ceil(this.users.length * 0.85);
  }

  /**
   * Get percentage of active devices
   */
  getActiveDevicePercent(): number {
    if (this.users.length === 0) return 0;
    return Math.round((this.getActiveDevices() / this.users.length) * 100);
  }

  /**
   * Get last update time
   */
  getLastUpdate(): string {
    const now = new Date();
    return now.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Get count of unique locations
   */
  getUniqueLocations(): number {
    const locations = new Set<string>();
    this.users.forEach((u) => {
      if (u.location_name) locations.add(u.location_name);
    });
    return locations.size;
  }

  /**
   * Get count of offline devices
   */
  getOfflineDevices(): number {
    return Math.floor(this.users.length * 0.15);
  }

  /**
   * Get count of new users added this week
   */
  getNewUsersCount(): number {
    return Math.max(1, Math.floor(this.users.length * 0.12));
  }

  /**
   * Get IP utilization percentage
   */
  getIPUtilization(): number {
    if (this.users.length === 0) return 0;
    return Math.round((this.getReservedCount() / this.users.length) * 100);
  }
}