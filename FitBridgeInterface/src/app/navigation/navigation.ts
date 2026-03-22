import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navigation',
  imports: [CommonModule],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation implements OnInit, OnDestroy {
  usuarioLogado: Usuario | null = null;
  private sub: Subscription | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.authService.usuario$.subscribe(u => this.usuarioLogado = u);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isInstrutor(): boolean {
    return this.usuarioLogado?.tipo === 'INSTRUTOR';
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
