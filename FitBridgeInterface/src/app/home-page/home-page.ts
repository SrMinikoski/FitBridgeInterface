import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navigation } from '../navigation/navigation';
import { AuthService, Usuario } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, Navigation],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit, OnDestroy {
  usuarioLogado: Usuario | null = null;
  private sub: Subscription | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.sub = this.authService.usuario$.subscribe(u => this.usuarioLogado = u);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  isInstrutor(): boolean {
    return (this.usuarioLogado?.tipo || '').toString().toUpperCase() === 'INSTRUTOR';
  }
}
