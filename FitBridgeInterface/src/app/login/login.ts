import { Component } from '@angular/core';
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
export class Login {
  email: string = '';
  senha: string = '';
  carregando: boolean = false;
  erro: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (!this.email || !this.senha) {
      this.erro = 'Por favor, preencha email e senha';
      return;
    }

    this.carregando = true;
    this.erro = '';

    this.authService.login(this.email, this.senha).subscribe({
      next: (usuario) => {
        this.carregando = false;
        if (usuario) {
          // Login bem-sucedido
          this.router.navigate(['/home']);
        } else {
          // Falha no login
          this.erro = 'Email ou senha inválidos';
        }
      },
      error: (err) => {
        this.carregando = false;
        this.erro = 'Erro ao conectar com a API';
        console.error('Login error', err);
      }
    });
  }

  criarConta() {
    // Redirecionar para cadastro
    this.router.navigate(['/cadastro-usuario']);
  }
}
