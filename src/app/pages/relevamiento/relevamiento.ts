import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-relevamiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relevamiento.html',
  styleUrl: './relevamiento.css'
})
export class Relevamiento implements OnInit {

  cargando = true;
  entrevistas: any[] = [];
  filtradas: any[] = [];
  busqueda = '';
  filtroEstado = '';
  mostrarForm = false;

  nueva: any = {
    legajo: '',
    entrevistador: '',
    fecha: '',
    modalidad: 'Presencial',
    observaciones: ''
  };

  constructor(private api: ApiService) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.api.leerTabla('Relevamiento').subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res.ok) {
          this.entrevistas = res.data;
          this.filtradas = res.data;
        }
      },
      error: () => { this.cargando = false; }
    });
  }

  filtrar() {
    this.filtradas = this.entrevistas.filter((e: any) => {
      const b = !this.busqueda ||
        e.legajo?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        e.entrevistador?.toLowerCase().includes(this.busqueda.toLowerCase());
      const s = !this.filtroEstado || e.estado === this.filtroEstado;
      return b && s;
    });
  }

  guardar() {
    if (!this.nueva.legajo) { alert('Ingresá el legajo'); return; }
    console.log('Guardando:', this.nueva);
    this.api.post({ action: 'createEntrevista', data: this.nueva }).subscribe({
      next: (res: any) => {
        console.log('Respuesta:', res);
        if (res.ok) {
          this.mostrarForm = false;
          this.nueva = { legajo: '', entrevistador: '', fecha: '', modalidad: 'Presencial', observaciones: '' };
          this.cargar();
        } else {
          alert('Error: ' + res.error);
        }
      },
      error: (err: any) => { console.error('Error:', err); }
    });
  }
}