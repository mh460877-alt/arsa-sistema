import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

declare var Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  encapsulation: ViewEncapsulation.None
})
export class Dashboard implements OnInit, AfterViewInit {

  cargando = true;
  stats = {
    total_empleados: 0,
    completadas: 0,
    desc_publicados: 0,
    total_entrevistas: 0
  };

  historico: any = null;

  // Valores animados para KPIs
  kv1 = 0; kv2 = 0; kv3 = 0; kv4 = 0;

  private statsOk     = false;
  private historicoOk = false;
  private chartsReady = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    // Llamada 1: KPIs
    this.api.stats().subscribe({
      next: (res) => {
        if (res.ok) {
          this.stats = res.data;
          this.statsOk = true;
          this.checkListo();
        }
      },
      error: () => { this.cargando = false; }
    });

    // Llamada 2: histórico para gráficos
    this.api.statsHistorico().subscribe({
      next: (res) => {
        if (res.ok) {
          this.historico = res.data;
        }
        this.historicoOk = true;
        this.checkListo();
      },
      error: () => { this.historicoOk = true; this.checkListo(); }
    });
  }

  ngAfterViewInit() {
    this.chartsReady = true;
    this.checkListo();
  }

  private checkListo() {
    if (this.statsOk && this.historicoOk && this.chartsReady) {
      this.cargando = false;
      setTimeout(() => {
        this.animarContadores();
        this.animarBarras();
        this.iniciarCharts();
      }, 100);
    }
  }

  animarContadores() {
    const targets = [
      { key: 'kv1', val: this.stats.total_empleados },
      { key: 'kv2', val: this.stats.total_entrevistas },
      { key: 'kv3', val: this.stats.completadas },
      { key: 'kv4', val: this.stats.desc_publicados },
    ];
    targets.forEach(({ key, val }) => {
      const duration = 1200;
      const startTime = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        (this as any)[key] = Math.round(ease * val);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  animarBarras() {
    setTimeout(() => {
      document.querySelectorAll('.prog-fill-anim').forEach((el: any) => {
        el.style.width = el.dataset['w'];
      });
    }, 200);
  }

  iniciarCharts() {
    this.chartBarras();
    this.chartDonut();
    this.chartLinea();
  }

  chartBarras() {
    const el = document.getElementById('db-chart-bars') as HTMLCanvasElement;
    if (!el || !Chart) return;
    if ((el as any)._chartInstance) (el as any)._chartInstance.destroy();

    const labels      = this.historico?.labels     || [];
    const completadas = this.historico?.completadas || [];
    const en_proceso  = this.historico?.en_proceso  || [];

    (el as any)._chartInstance = new Chart(el.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Completadas', data: completadas,
            backgroundColor: 'rgba(75,174,212,.85)', borderRadius: 4 },
          { label: 'En proceso',  data: en_proceso,
            backgroundColor: 'rgba(232,160,32,.7)',  borderRadius: 4 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 10, padding: 14 } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#6B8299' } },
          y: { grid: { color: 'rgba(168,216,234,.2)' }, ticks: { font: { size: 11 }, color: '#6B8299' }, beginAtZero: true }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    });
  }

  chartDonut() {
    const el = document.getElementById('db-chart-donut') as HTMLCanvasElement;
    if (!el || !Chart) return;
    if ((el as any)._chartInstance) (el as any)._chartInstance.destroy();

    const completadas = this.stats.completadas;
    const pendientes  = Math.max(0, this.stats.total_entrevistas - completadas);

    (el as any)._chartInstance = new Chart(el.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Completadas', 'Pendientes'],
        datasets: [{
          data: [completadas, pendientes],
          backgroundColor: ['#4BAED4', '#EEF5FA'],
          borderColor:     ['#4BAED4', '#D0E8F5'],
          borderWidth: 2, hoverOffset: 6
        }]
      },
      options: {
        cutout: '72%', responsive: true, maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { bodyFont: { size: 11 } } },
        animation: { duration: 1200, easing: 'easeOutQuart' }
      }
    });
  }

  chartLinea() {
    const el = document.getElementById('db-chart-line') as HTMLCanvasElement;
    if (!el || !Chart) return;
    if ((el as any)._chartInstance) (el as any)._chartInstance.destroy();

    const ctx = el.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 160);
    grad.addColorStop(0, 'rgba(75,174,212,.25)');
    grad.addColorStop(1, 'rgba(75,174,212,0)');

    const labels    = this.historico?.labels        || [];
    const acumulado = this.historico?.desc_acumulado || [];
    const n         = labels.length;
    const meta      = Array.from({ length: n }, (_, i) => Math.round(70 * (i + 1) / n));

    (el as any)._chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Publicados',
            data: acumulado,
            borderColor: '#4BAED4', borderWidth: 2,
            backgroundColor: grad, fill: true,
            tension: 0.4, pointRadius: 3, pointBackgroundColor: '#4BAED4' },
          { label: 'Meta',
            data: meta,
            borderColor: 'rgba(107,130,153,.35)', borderWidth: 1.5,
            borderDash: [4, 4], fill: false, tension: 0, pointRadius: 0 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 10, padding: 14 } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#6B8299' } },
          y: { grid: { color: 'rgba(168,216,234,.2)' }, ticks: { font: { size: 11 }, color: '#6B8299' }, beginAtZero: true }
        },
        animation: { duration: 1000 }
      }
    });
  }

  get pctCompletadas(): string {
    if (!this.stats.total_entrevistas) return '0%';
    return (this.stats.completadas / this.stats.total_entrevistas * 100).toFixed(0) + '%';
  }

  get pctPendientes(): string { return '100%'; }
}