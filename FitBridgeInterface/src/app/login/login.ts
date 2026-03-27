import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  email: string = '';
  senha: string = '';
  carregando: boolean = false;
  erro: string = '';
  erroVisivel: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Se já está logado, redireciona para home
    if (this.authService.estaLogado()) {
      this.router.navigate(['/home']);
    }
  }

  login() {
    if (!this.email || !this.senha) {
      this.erro = 'Por favor, preencha email e senha';
      return;
    }

    this.carregando = true;
    this.erro = '';
    this.erroVisivel = false;

    this.authService.login(this.email, this.senha).subscribe({
      next: (usuario) => {
        this.carregando = false;
        if (usuario) {
          this.router.navigate(['/home']);
        } else {
          this.mostrarErro('Email ou senha inválidos. Verifique suas credenciais.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.carregando = false;
        if (err?.status === 401 || err?.status === 403) {
          this.mostrarErro('Senha incorreta. Tente novamente.');
        } else if (err?.status === 404) {
          this.mostrarErro('Usuário não encontrado. Verifique seu email.');
        } else if (err?.status === 0 || err?.status === null) {
          this.mostrarErro('Erro de conexão. Verifique se o servidor está ativo.');
        } else {
          this.mostrarErro('Erro ao conectar com o servidor. Tente novamente mais tarde.');
        }
        this.cdr.detectChanges();
      }
    });
  }

  mostrarErro(mensagem: string) {
    this.erro = mensagem;
    this.erroVisivel = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.erroVisivel = false;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.erro = '';
        this.cdr.detectChanges();
      }, 300);
    }, 5000);
  }

  criarConta() {
    // Redirecionar para cadastro
    this.router.navigate(['/cadastro-usuario']);
  }
}
