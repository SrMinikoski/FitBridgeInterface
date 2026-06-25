import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, NgZone, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navigation } from '../navigation/navigation';
import { AuthService, Usuario } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink, Navigation, FormsModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit, OnDestroy {
  usuarioLogado: Usuario | null = null;
  private sub: Subscription | null = null;

  // Carrossel
  slideAtual = signal(0);
  readonly totalSlides = 6;
  private intervaloCarousel: ReturnType<typeof setInterval> | null = null;

  // Propriedades de busca
  termoBusca: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.sub = this.authService.usuario$.subscribe(u => this.usuarioLogado = u);
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        this.intervaloCarousel = setInterval(() => {
          this.ngZone.run(() => this.proximoSlide());
        }, 5000);
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.intervaloCarousel) clearInterval(this.intervaloCarousel);
  }

  proximoSlide(): void {
    this.slideAtual.update(v => (v + 1) % this.totalSlides);
  }

  slideAnterior(): void {
    this.slideAtual.update(v => (v - 1 + this.totalSlides) % this.totalSlides);
    this.reiniciarIntervalo();
  }

  avancarSlide(): void {
    this.proximoSlide();
    this.reiniciarIntervalo();
  }

  reiniciarIntervalo(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.intervaloCarousel) clearInterval(this.intervaloCarousel);
    this.ngZone.runOutsideAngular(() => {
      this.intervaloCarousel = setInterval(() => {
        this.ngZone.run(() => this.proximoSlide());
      }, 5000);
    });
  }

  isInstrutor(): boolean {
    return (this.usuarioLogado?.tipo || '').toString().toUpperCase() === 'INSTRUTOR';
  }

  /**
   * Realiza a busca e redireciona para a página de treinos
   */
  executarBusca(): void {
    if (this.termoBusca.trim().length === 0) {
      return;
    }
    
    this.router.navigate(['/treinos'], { 
      queryParams: { busca: this.termoBusca.trim() } 
    });
  }

  /**
   * Executa a busca ao pressionar Enter
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.executarBusca();
    }
  }

  /**
   * Limpa o campo de busca
   */
  limparBusca(): void {
    this.termoBusca = '';
  }
}
