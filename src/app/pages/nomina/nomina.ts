import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-nomina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nomina.html',
  styleUrl: './nomina.css'
})
export class Nomina implements OnInit {

  cargando = true;
  empleados: any[] = [];
  filtrados: any[] = [];
  busqueda = '';
  filtroSede = '';
  sedes: string[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.leerTabla('Nomina').subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.ok) {
          this.empleados = res.data;
          this.filtrados = res.data;
          this.sedes = [...new Set(res.data.map((e: any) => e.sede).filter(Boolean))] as string[];
        }
      },
      error: () => { this.cargando = false; }
    });
  }

  filtrar() {
    this.filtrados = this.empleados.filter(e => {
      const coincideBusqueda =
        !this.busqueda ||
        e.apellido_nombre?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        e.legajo?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        e.puesto?.toLowerCase().includes(this.busqueda.toLowerCase());
      const coincideSede =
        !this.filtroSede || e.sede === this.filtroSede;
      return coincideBusqueda && coincideSede;
    });
  }
}