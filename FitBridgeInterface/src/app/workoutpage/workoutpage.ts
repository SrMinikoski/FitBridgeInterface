import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Navigation } from '../navigation/navigation';

@Component({
  selector: 'app-workoutpage',
  imports: [Navigation],
  templateUrl: './workoutpage.html',
  styleUrl: './workoutpage.css',
})
export class Workoutpage implements OnInit {
  expandedCards: boolean[] = [false, false, false];
  treinoId: number | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Captura o ID do treino da query parameter
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.treinoId = parseInt(params['id'], 10);
        console.log('Treino ID capturado:', this.treinoId);
        // TODO: Carregar dados do treino específico com base no ID
        this.carregarTreinoPorId(this.treinoId);
      }
    });
  }

  /**
   * Carrega os dados do treino específico pela API
   * TODO: Implementar chamada à API quando disponível
   */
  carregarTreinoPorId(id: number): void {
    console.log('Carregando treino com ID:', id);
    // Implementação futura para carregar dados reais do treino
    // this.treinoService.obterTreinoPorId(id).subscribe(
    //   (treino) => {
    //     this.atualizarTreino(treino);
    //   },
    //   (error) => {
    //     console.error('Erro ao carregar treino:', error);
    //   }
    // );
  }

  toggleCard(index: number, event: Event): void {
    event.stopPropagation();
    this.expandedCards[index] = !this.expandedCards[index];
  }

  // Prepare a print-ready version (expand all), ask user to save, and download PDF if confirmed
  prepareAndMaybeSavePdf(): void {
    const previousState = [...this.expandedCards];
    // expand all
    this.expandedCards = this.expandedCards.map(() => true);

    // wait for CSS animation to finish (match transition time ~450ms)
    setTimeout(() => {
      const wantsToSave = window.confirm('Versão para impressão gerada. Deseja salvar o treino em seu dispositivo?');
      if (wantsToSave) {
        this.downloadPdf().then(() => {
          // restore previous expanded state
          this.expandedCards = previousState;
        }).catch(() => {
          this.expandedCards = previousState;
        });
      } else {
        // restore if user cancels
        this.expandedCards = previousState;
      }
    }, 500);
  }

  async downloadPdf(): Promise<void> {
    // Ensure html2pdf is available
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

    const opt = {
      margin:       10,
      filename:     'treino.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // hide the PDF button and all checkboxes so they don't appear in the generated PDF
    const pdfBtn = document.getElementById('pdf') as HTMLElement | null;
    const prevPdfDisplay = pdfBtn ? pdfBtn.style.display : null;
    if (pdfBtn) pdfBtn.style.display = 'none';

    const inputs = Array.from(element.querySelectorAll('input')) as HTMLElement[];
    const prevDisplays = inputs.map(i => i.style.display || '');
    inputs.forEach(i => i.style.display = 'none');

    return new Promise((resolve, reject) => {
      try {
        (window as any).html2pdf().set(opt).from(element).save().then(() => {
          // restore pdf button and inputs
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

  isCardExpanded(index: number): boolean {
    return this.expandedCards[index];
  }
}
