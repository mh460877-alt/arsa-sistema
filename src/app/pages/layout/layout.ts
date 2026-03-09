import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class LayoutComponent implements OnInit {

  usuario: any = null;
  rutaActual = '';
  notifVisible = false;
  notifMsg = '';

  menuAdmin = [
    {
      nombre: 'General',
      items: [
        { icon: '◈', label: 'Dashboard', ruta: '/dashboard', bloqueado: false }
      ]
    },
    {
      nombre: 'Gestión',
      items: [
        { icon: '◻', label: 'Nómina',         ruta: '/nomina',         bloqueado: false },
        { icon: '📝', label: 'Relevamiento',   ruta: '/relevamiento',   bloqueado: false },
        { icon: '📄', label: 'Descriptivos',   ruta: '/descriptivos',   bloqueado: false },
        { icon: '📋', label: 'Procedimientos', ruta: '/procedimientos', bloqueado: false },
      ]
    },
    {
      nombre: 'Estructura',
      items: [
        { icon: '◎', label: 'Organigrama', ruta: '/organigrama', bloqueado: false }
      ]
    },
    {
      nombre: 'Sistema',
      items: [
        { icon: '👥', label: 'Usuarios',     ruta: '/usuarios', bloqueado: false },
        { icon: '🔒', label: 'Capacitación', ruta: '',          bloqueado: true  }
      ]
    }
  ];

  menuEmpleado = [
    {
      nombre: 'Mi Puesto',
      items: [
        { icon: '📄', label: 'Mi Descriptivo', ruta: '/mi-descriptivo', bloqueado: false }
      ]
    }
  ];

  seccionesMenu: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    const raw = localStorage.getItem('usuario');
    if (!raw) { this.router.navigate(['/login']); return; }
    this.usuario = JSON.parse(raw);

    this.seccionesMenu = this.usuario.rol === 'empleado'
      ? this.menuEmpleado
      : this.menuAdmin;

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.rutaActual = e.urlAfterRedirects;
    });
    this.rutaActual = this.router.url;

    if (this.usuario.rol === 'empleado') {
      this.router.navigate(['/mi-descriptivo']);
    }
  }

  navegar(item: any) {
    if (item.bloqueado || !item.ruta) return;
    this.router.navigate([item.ruta]);
  }

  salir() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}