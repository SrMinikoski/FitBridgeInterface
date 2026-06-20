import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Navigation } from '../navigation/navigation';

interface Exercicio {
  id: number;
  nome: string;
  descricao: string;
  musculoAlvo: string;
  musculosAuxiliares?: string;
  diretorioImagem?: string;
}

@Component({
  selector: 'app-lista-exercicios',
  imports: [CommonModule, Navigation],
  templateUrl: './lista-exercicios.html',
  styleUrl: './lista-exercicios.css',
})
export class ListaExercicios implements OnInit {
  exercicios: Exercicio[] = [];
  carregando: boolean = true;
  erro: string = '';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      console.log('Iniciando carregamento de exercícios (browser)');
      this.carregarExercicios();
    } else {
      console.log('Não é browser, pulando carregamento');
    }
  }

  carregarExercicios(): void {
    console.log('Fazendo requisição para /api/exercicios');
    this.http.get<Exercicio[]>('https://fitbridge-exv.onrender.com/api/exercicios').subscribe({
      next: (dados) => {
        console.log('Dados recebidos:', dados);
        
        // Log de debug para as imagens
        dados.forEach(ex => {
          console.log(`Exercício: ${ex.nome}`, {
            temImagem: this.temImagem(ex),
            diretorioOriginal: ex.diretorioImagem,
            urlProcessada: this.obterUrlImagem(ex),
          });
        });
        
        this.exercicios = dados;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Erro ao carregar exercícios:', error);
        console.error('Status:', error.status);
        console.error('URL:', error.url);
        this.erro = 'Erro ao carregar exercícios. Tente novamente mais tarde.';
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }

  temImagem(exercicio: Exercicio): boolean {
    return !!(exercicio.diretorioImagem && exercicio.diretorioImagem.trim());
  }

  obterUrlImagem(exercicio: Exercicio): string {
    if (this.temImagem(exercicio)) {
      const path = exercicio.diretorioImagem!.trim();
      
      // Se é uma URL completa (http:// ou https://), retorna direto
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      
      // Se já começa com / ou exercises/, usa direto
      if (path.startsWith('/') || path.startsWith('exercises/')) {
        return path.startsWith('/') ? path : `/${path}`;
      }
      
      // Se é apenas o nome do arquivo, assume exercises/
      if (!path.includes('/')) {
        return `/exercises/${path}`;
      }
      
      // Para outros formatos, tenta usar como está
      return `/${path}`;
    }
    return '';
  }

  onImageError(event: Event, exercicio: Exercicio): void {
    const img = event.target as HTMLImageElement;
    console.warn(`Erro ao carregar imagem para: ${exercicio.nome}`, {
      tentouCarregar: this.obterUrlImagem(exercicio),
      diretorioOriginal: exercicio.diretorioImagem,
    });
    img.style.display = 'none';
  }
}
