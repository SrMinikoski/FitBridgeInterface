import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Adicionar o ID do usuário logado ao header
  const usuario = authService.getUsuarioLogado();
  
  if (usuario && usuario.id) {
    // Clone da requisição com header adicional
    req = req.clone({
      setHeaders: {
        'X-User-ID': usuario.id.toString(),
        'X-User-Type': usuario.tipo || 'ALUNO'
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ignorar erro 401 do endpoint de login (credenciais inválidas é normal)
      if (error.status === 401 && !req.url.includes('/login')) {
        // Token inválido ou expirado em outros endpoints - fazer logout
        console.error('Erro 401: Não autorizado. Fazendo logout...');
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => new Error('Sessão expirada. Faça login novamente.'));
      }
      // Deixar passar erros normalmente (incluindo 401 do login)
      return throwError(() => error);
    })
  );
};
