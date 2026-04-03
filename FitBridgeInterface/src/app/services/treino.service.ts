import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Instrutor {
  id: number;
  nome: string;
  sexo?: string;
  idade?: number;
  crefDiploma?: string;
}

export interface Exercicio {
  id: number;
  nome: string;
  descricao: string;
  musculoAlvo: string;
  musculosAuxiliares: string;
  diretorioImagem?: string;
}

export interface TreinoItem {
  id: number;
  exercicio: Exercicio;
  series: number;
  repeticoes: number;
}

export interface Treino {
  id: number;
  titulo: string;
  tituloNormalizado?: string | null;
  grupoMuscular: string;
  grupoMuscularNormalizado?: string | null;
  descricao: string;
  diretorioImagem?: string | null;
  itens?: TreinoItem[];
  instrutor?: Instrutor;
}

@Injectable({
  providedIn: 'root'
})
export class TreinoService {
  private apiUrl = 'https://fitbridge-exv.onrender.com/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtém todos os treinos da API
   */
  obterTreinos(): Observable<Treino[]> {
    return this.http.get<Treino[]>(`${this.apiUrl}/treinos`);
  }

  /**
   * Obtém um treino específico por ID
   */
  obterTreinoPorId(id: number): Observable<Treino> {
    return this.http.get<Treino>(`${this.apiUrl}/treinos/${id}`);
  }

  /**
   * Busca treinos por termo
   */
  buscarTreinos(termo: string): Observable<Treino[]> {
    return this.http.get<Treino[]>(`${this.apiUrl}/treinos/busca/${termo}`);
  }
}
