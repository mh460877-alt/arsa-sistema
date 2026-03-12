import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private url = 'https://script.google.com/macros/s/AKfycbzte9JEZnK8pe6E_fOUNrwCxfZpCy6RLb0jNcrMpKVUE0_kAeczgmM0VCxpZq2WWRn4pg/exec';

  constructor(private http: HttpClient) {}

  login(usuario: string, password: string): Observable<any> {
    const params = new HttpParams()
      .set('action', 'login')
      .set('usuario', usuario)
      .set('password', password);
    return this.http.get(this.url, { params });
  }

  stats(): Observable<any> {
    const params = new HttpParams().set('action', 'stats');
    return this.http.get(this.url, { params });
  }

  statsHistorico(): Observable<any> {
    const params = new HttpParams().set('action', 'statsHistorico');
    return this.http.get(this.url, { params });
  }

  leerTabla(tab: string): Observable<any> {
    const params = new HttpParams()
      .set('action', 'read')
      .set('tab', tab);
    return this.http.get(this.url, { params });
  }

  getEmpleado(legajo: string): Observable<any> {
    const params = new HttpParams()
      .set('action', 'getEmpleado')
      .set('legajo', legajo);
    return this.http.get(this.url, { params });
  }

  post(body: any): Observable<any> {
    const dataStr = encodeURIComponent(JSON.stringify(body.data || {}));
    const fullUrl = `${this.url}?action=${body.action}&data=${dataStr}`;
    return this.http.get(fullUrl);
  }
}