import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cadstro-user',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cadstro-user.html',
  styleUrl: './cadstro-user.css',
})
export class CadstroUser {
  nome = '';
  idade: number | null = null;
  peso: number | null = null;
  altura: number | null = null;
  sexo = '';
  objetivo = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  carregando = false;
  erro = '';
  sucesso = '';

  private apiUrl = '/api';

  constructor(private http: HttpClient, private router: Router) {}

  cadastrar() {
    this.erro = '';
    this.sucesso = '';

    if (!this.nome || !this.email || !this.senha) {
      this.erro = 'Preencha nome, email e senha.';
      return;
    }
    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas não coincidem.';
      return;
    }

    this.carregando = true;

    const aluno = {
      nome: this.nome,
      sexo: this.sexo || null,
      idade: this.idade,
      altura: this.altura,
      peso: this.peso,
      objetivo: this.objetivo || null,
      email: this.email,
      senha: this.senha,
    };

    this.http.post<any>(`${this.apiUrl}/alunos`, aluno).subscribe({
      next: () => {
        this.carregando = false;
        this.sucesso = 'Conta criada com sucesso! Redirecionando...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Erro ao cadastrar. Tente novamente.';
      },
    });
  }
}
