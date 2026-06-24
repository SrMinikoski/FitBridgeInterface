import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Navigation } from '../navigation/navigation';
import { TreinoService, Treino, TreinoItem } from '../services/treino.service';
import { FavoritosService } from '../services/favoritos.service';
import { AuthService } from '../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-workoutpage',
  standalone: true,
  imports: [CommonModule, Navigation],
  templateUrl: './workoutpage.html',
  styleUrl: './workoutpage.css',
})
export class Workoutpage implements OnInit, OnDestroy {
  treino = signal<Treino | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);
  favorito = signal(false);
  expandedCards: boolean[] = [];
  podeEditarTreino = signal(false);

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private treinoService: TreinoService,
    private favoritosService: FavoritosService,
    private authService: AuthService
  ) {
    // Verifica se o usuário é instrutor
    const usuario = this.authService.getUsuarioLogado();
    this.podeEditarTreino.set(usuario?.tipo === 'INSTRUTOR');
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.carregarTreino(parseInt(params['id'], 10));
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarTreino(id: number): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.treinoService.obterTreinoPorId(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (treino: Treino) => {
          this.treino.set(treino);
          this.expandedCards = (treino.itens || []).map(() => false);
          this.favorito.set(this.favoritosService.isFavorito(treino.id));
          this.carregando.set(false);
        },
        error: (error) => {
          console.error('Erro ao carregar treino:', error);
          this.erro.set('Erro ao carregar treino. Tente novamente.');
          this.carregando.set(false);
        }
      });
  }

  /**
   * Normaliza URLs de imagem
   * Se for URL absoluta (http/https), retorna como está
   * Se for relativa, adiciona barra no início
   */
  private normalizarUrlImagem(url: string | undefined | null): string | null {
    if (!url) return null;
    
    console.log('>>> NORMALIZANDO URL (workoutpage) <<<', url);
    
    // PRIMEIRO: Verifica se já começa com protocolo (http/https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('✓ JÁ ABSOLUTA:', url);
      return url;
    }
    
    // DEPOIS: Se começa com barra, remove e verifica novamente
    if (url.startsWith('/')) {
      const urlSemBarra = url.substring(1);
      console.log('Verificando após remover barra:', urlSemBarra);
      if (urlSemBarra.startsWith('http://') || urlSemBarra.startsWith('https://')) {
        console.log('✓ ERA /https:// AGORA CORRIGIDA:', urlSemBarra);
        return urlSemBarra;
      }
    }
    
    // Se for relativa, adiciona barra
    const urlFinal = '/' + url;
    console.log('✓ RELATIVA - ADICIONANDO BARRA:', urlFinal);
    return urlFinal;
  }

  obterImagemExercicio(item: TreinoItem): string {
    if (item.exercicio?.diretorioImagem) {
      return this.normalizarUrlImagem(item.exercicio.diretorioImagem) || '/exercises/biceps_apoiado.avif';
    }
    return '/exercises/biceps_apoiado.avif';
  }

  /**
   * Obtém a URL da imagem de capa do treino
   */
  obterImagemCapaTreino(): string | null {
    const t = this.treino();
    if (!t) return null;

    // 1. Imagem do próprio treino
    if (t.diretorioImagem) {
      return this.normalizarUrlImagem(t.diretorioImagem);
    }

    // 2. Imagem do primeiro exercício que tenha uma
    if (t.itens?.length) {
      for (const item of t.itens) {
        if (item.exercicio?.diretorioImagem) {
          return this.normalizarUrlImagem(item.exercicio.diretorioImagem);
        }
      }
    }

    // 3. Sem imagem disponível
    return null;
  }

  toggleFavorito(): void {
    const t = this.treino();
    if (!t) return;
    const novoEstado = this.favoritosService.toggleFavorito(t.id);
    this.favorito.set(novoEstado);
  }

  toggleCard(index: number, event: Event): void {
    event.stopPropagation();
    this.expandedCards[index] = !this.expandedCards[index];
  }

  isCardExpanded(index: number): boolean {
    return this.expandedCards[index] ?? false;
  }

  prepareAndMaybeSavePdf(): void {
    const previousState = [...this.expandedCards];
    this.expandedCards = this.expandedCards.map(() => true);

    setTimeout(() => {
      const wantsToSave = window.confirm('Versão para impressão gerada. Deseja salvar o treino em seu dispositivo?');
      if (wantsToSave) {
        this.downloadPdf().then(() => {
          this.expandedCards = previousState;
        }).catch(() => {
          this.expandedCards = previousState;
        });
      } else {
        this.expandedCards = previousState;
      }
    }, 500);
  }

  async downloadPdf(): Promise<void> {
    const html2pdfLib = (window as any).html2pdf;
    if (!html2pdfLib) {
      alert('Biblioteca html2pdf não encontrada. Verifique se o script foi carregado.');
      return;
    }

    const element = document.querySelector('.content') as HTMLElement;
    if (!element) {
      alert('Conteúdo não encontrado para geração do PDF.');
      return;
    }

    const treino = this.treino();
    const filename = treino ? treino.titulo.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf' : 'treino.pdf';

    const opt = {
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const pdfBtn = document.getElementById('pdf') as HTMLElement | null;
    const prevPdfDisplay = pdfBtn ? pdfBtn.style.display : null;
    if (pdfBtn) pdfBtn.style.display = 'none';

    const inputs = Array.from(element.querySelectorAll('input')) as HTMLElement[];
    const prevDisplays = inputs.map(i => i.style.display || '');
    inputs.forEach(i => i.style.display = 'none');

    return new Promise((resolve, reject) => {
      try {
        (window as any).html2pdf().set(opt).from(element).save().then(() => {
          if (pdfBtn) pdfBtn.style.display = prevPdfDisplay || '';
          inputs.forEach((i, idx) => i.style.display = prevDisplays[idx] || '');
          resolve();
        }).catch((err: any) => {
          if (pdfBtn) pdfBtn.style.display = prevPdfDisplay || '';
          inputs.forEach((i, idx) => i.style.display = prevDisplays[idx] || '');
          reject(err);
        });
      } catch (err) {
        if (pdfBtn) pdfBtn.style.display = prevPdfDisplay || '';
        inputs.forEach((i, idx) => i.style.display = prevDisplays[idx] || '');
        reject(err);
      }
    });
  }

  /**
   * Deleta o treino atual após confirmação do usuário
   */
  deletarTreino(): void {
    const t = this.treino();
    if (!t) return;
    
    const confirmacao = confirm(`Tem certeza que deseja excluir o treino "${t.titulo}"? Esta ação não pode ser desfeita.`);
    
    if (confirmacao) {
      this.treinoService.deletarTreino(t.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/treinos']);
          },
          error: (error) => {
            console.error('Erro ao deletar treino:', error);
            alert('Erro ao excluir o treino. Tente novamente.');
          }
        });
    }
  }
}
