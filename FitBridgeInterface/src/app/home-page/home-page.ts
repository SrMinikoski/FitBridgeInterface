import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  
  // Propriedades de busca
  termoBusca: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.authService.usuario$.subscribe(u => this.usuarioLogado = u);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
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
