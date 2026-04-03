import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Navigation } from '../navigation/navigation';
import { TreinoService, Treino, TreinoItem } from '../services/treino.service';
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
  expandedCards: boolean[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private treinoService: TreinoService
  ) {}

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
          this.carregando.set(false);
        },
        error: (error) => {
          console.error('Erro ao carregar treino:', error);
          this.erro.set('Erro ao carregar treino. Tente novamente.');
          this.carregando.set(false);
        }
      });
  }

  obterImagemExercicio(item: TreinoItem): string {
    if (item.exercicio?.diretorioImagem) {
      return '/' + item.exercicio.diretorioImagem;
    }
    return '/exercises/biceps_apoiado.avif';
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
}
