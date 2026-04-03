import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritosService {
  private storageKey = 'fitbridge_favoritos';
  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private getKey(): string {
    const usuario = this.authService.getUsuarioLogado();
    const userId = usuario?.id ?? 'guest';
    return `${this.storageKey}_${userId}`;
  }

  private getFavoritos(): number[] {
    if (!this.isBrowser) return [];
    const data = localStorage.getItem(this.getKey());
    return data ? JSON.parse(data) : [];
  }

  private salvarFavoritos(ids: number[]): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.getKey(), JSON.stringify(ids));
  }

  isFavorito(treinoId: number): boolean {
    return this.getFavoritos().includes(treinoId);
  }

  toggleFavorito(treinoId: number): boolean {
    const favoritos = this.getFavoritos();
    const index = favoritos.indexOf(treinoId);
    if (index > -1) {
      favoritos.splice(index, 1);
      this.salvarFavoritos(favoritos);
      return false;
    } else {
      favoritos.push(treinoId);
      this.salvarFavoritos(favoritos);
      return true;
    }
  }

  obterFavoritosIds(): number[] {
    return this.getFavoritos();
  }
}
