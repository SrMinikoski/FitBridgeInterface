import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError, timeout } from 'rxjs/operators';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: 'ALUNO' | 'INSTRUTOR';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api';
  private usuarioLogadoKey = 'usuarioLogado';
  private isBrowser: boolean;
  private usuarioSubject: BehaviorSubject<Usuario | null>;
  public usuario$;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.usuarioSubject = new BehaviorSubject<Usuario | null>(this.getUsuarioLogado());
    this.usuario$ = this.usuarioSubject.asObservable();
  }

  login(email: string, senha: string): Observable<Usuario | null> {
    const payload = { email, senha };
    return this.http.post<any>(`${this.apiUrl}/login`, payload).pipe(
      timeout(10000),
      map((res) => {
        if (res && res.id) {
          return { id: res.id, nome: res.nome, email: res.email, tipo: res.tipo } as Usuario;
        }
        return null;
      }),
      tap((usuario) => {
        if (usuario) {
          if (this.isBrowser) {
            localStorage.setItem(this.usuarioLogadoKey, JSON.stringify(usuario));
          }
          this.usuarioSubject.next(usuario);
        }
      }),
      catchError(() => of(null))
    );
  }

  private buscarAlunos(email: string, senha: string): Observable<Usuario | null> {
    return this.http.get<any[]>(`${this.apiUrl}/alunos`).pipe(
      map((alunos) => {
        const aluno = alunos.find(a => a.email === email && a.senha === senha);
        return aluno ? {
          id: aluno.id,
          nome: aluno.nome,
          email: aluno.email,
          tipo: 'ALUNO'
        } : null;
      })
    );
  }

  private buscarInstrutores(email: string, senha: string): Observable<Usuario | null> {
    return this.http.get<any[]>(`${this.apiUrl}/instrutores`).pipe(
      map((instrutores) => {
        const instrutor = instrutores.find(i => i.email === email && i.senha === senha);
        return instrutor ? {
          id: instrutor.id,
          nome: instrutor.nome,
          email: instrutor.email,
          tipo: 'INSTRUTOR'
        } : null;
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.usuarioLogadoKey);
    }
    this.usuarioSubject.next(null);
  }

  getUsuarioLogado(): Usuario | null {
    if (!this.isBrowser) {
      return null;
    }
    const usuario = localStorage.getItem(this.usuarioLogadoKey);
    return usuario ? JSON.parse(usuario) : null;
  }

  estaLogado(): boolean {
    return !!this.getUsuarioLogado();
  }
}
