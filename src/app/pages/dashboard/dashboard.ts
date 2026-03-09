import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  cargando = true;
  stats = {
    total_empleados: 0,
    completadas: 0,
    desc_publicados: 0,
    total_entrevistas: 0
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.stats().subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.ok) this.stats = res.data;
      },
      error: () => { this.cargando = false; }
    });
  }
}