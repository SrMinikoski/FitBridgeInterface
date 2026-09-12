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
    const wantsToSave = window.confirm('Deseja salvar o treino em formato PDF em seu dispositivo?');
    if (wantsToSave) {
      this.downloadPdf().catch(err => {
        console.error('Erro ao gerar PDF:', err);
      });
    }
  }

  async downloadPdf(): Promise<void> {
    const html2pdfLib = (window as any).html2pdf;
    if (!html2pdfLib) {
      alert('Biblioteca html2pdf não encontrada. Verifique se o script foi carregado.');
      return;
    }

    const sourceElement = document.querySelector('.content') as HTMLElement;
    if (!sourceElement) {
      alert('Conteúdo não encontrado para geração do PDF.');
      return;
    }

    const treino = this.treino();
    const filename = treino ? treino.titulo.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf' : 'treino.pdf';

    // Overlay opaco: evita que o usuário veja o layout fixo sendo montado fora do viewport atual
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:#E8D2B3;display:flex;align-items:center;justify-content:center;z-index:100000;font-size:18px;color:#8F3A33;font-weight:bold;';
    overlay.textContent = 'Gerando PDF...';
    document.body.appendChild(overlay);

    // Clone com largura fixa de 750px, renderizado on-screen (position:fixed) para evitar
    // que o html2canvas gere um canvas em branco, o que ocorre com posicionamento negativo/off-screen.
    const clone = sourceElement.cloneNode(true) as HTMLElement;
    clone.classList.add('pdf-export-mode');

    const selectorsToRemove = [
      '#pdf',
      '.acoes-treino',
      'app-navigation',
      '#explicacao',
      '.carregando',
      '.erro-mensagem',
      '.btn-deletar-workout',
      '.ExerciseDone'
    ];
    selectorsToRemove.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Garante que todas as descrições de exercício estejam expandidas e visíveis
    const cards = Array.from(clone.querySelectorAll('.card'));
    cards.forEach((card, index) => {
      card.classList.add('expanded');
      card.querySelector('.description')?.classList.add('visible');

      // html2canvas não renderiza corretamente o background-image de <input>; troca por <img>
      const toggle = card.querySelector('.exercise-toggle') as HTMLElement | null;
      const item = treino?.itens?.[index];
      if (toggle && item) {
        const img = document.createElement('img');
        img.src = this.obterImagemExercicio(item);
        img.className = 'exercise-toggle';
        img.alt = item.exercicio?.nome || 'Exercício';
        // Estilo inline como reforço: garante o tamanho mesmo se o html2canvas ignorar a classe CSS
        img.style.cssText = 'width:36px;height:36px;min-width:36px;min-height:36px;max-width:36px;max-height:36px;flex-shrink:0;object-fit:cover;border-radius:10px;display:block;';
        toggle.replaceWith(img);
      }
    });

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;top:0;left:0;width:600px;z-index:99999;';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Remove o clipping horizontal do body para o clone não ser cortado em telas estreitas
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'visible';

    const opt = {
      // Sem margem vertical (evita corte de imagens entre páginas); mantém apenas a lateral
      margin: [0, 14, 0, 14],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        width: 600,
        windowWidth: 600,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      // 'avoid-all' forçava toda a árvore a evitar quebras, gerando espaços em branco enormes;
      // 'css' respeita apenas os elementos com page-break-inside/break-inside: avoid definidos
      pagebreak: { mode: ['css', 'legacy'] }
    };

    await this.aguardarImagens(clone);

    try {
      await (window as any).html2pdf().set(opt).from(clone).save();
    } finally {
      document.body.removeChild(wrapper);
      document.body.removeChild(overlay);
      document.body.style.overflow = prevBodyOverflow;
    }
  }

  private aguardarImagens(container: HTMLElement): Promise<void> {
    const imagens = Array.from(container.querySelectorAll('img'));
    const promessas = imagens.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.addEventListener('load', () => resolve());
        img.addEventListener('error', () => resolve());
      });
    });
    return Promise.all(promessas).then(() => undefined);
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
