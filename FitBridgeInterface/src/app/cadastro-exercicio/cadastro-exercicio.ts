import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Mensagem {
  tipo: 'sucesso' | 'erro';
  texto: string;
  visivel: boolean;
}

@Component({
  selector: 'app-cadastro-exercicio',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './cadastro-exercicio.html',
  styleUrl: './cadastro-exercicio.css',
})
export class CadastroExercicio {
  private apiUrl = '/api';

  nomeImagem: string = '';
  imagemPreview: string | null = null;
  arquivoImagem: File | null = null;
  mensagem: Mensagem = {
    tipo: 'sucesso',
    texto: '',
    visivel: false,
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    this.arquivoImagem = file;
    this.nomeImagem = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagemPreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  onSubmit(form: any): void {
    if (!form.valid) {
      this.exibirMensagem('erro', 'Preencha todos os campos.');
      return;
    }

    if (!this.arquivoImagem) {
      this.exibirMensagem('erro', 'Selecione uma imagem.');
      return;
    }

    // 1. Upload da imagem via Express SSR (mesma origem)
    const formData = new FormData();
    formData.append('file', this.arquivoImagem);

    this.http.post<any>(`${this.apiUrl}/upload-exercise-image`, formData).subscribe({
      next: (response) => {
        console.log('Resposta do upload:', response);
        // 2. Cadastrar exercício na API Spring Boot com o caminho da imagem
        const dadosExercicio = {
          nome: form.value.exerciseName,
          descricao: form.value.description,
          musculoAlvo: form.value.mainMuscle,
          musculosAuxiliares: form.value.auxiliaryMuscles,
          diretorioImagem: response.filePath,
        };
        
        console.log('Enviando dados do exercício:', dadosExercicio);

        this.http.post<any>(`${this.apiUrl}/exercicios`, dadosExercicio).subscribe({
          next: () => {
            this.exibirMensagem('sucesso', 'Exercício cadastrado com sucesso!');

            setTimeout(() => {
              this.limparFormulario();
              form.resetForm();
              this.cdr.detectChanges();
            }, 2000);
          },
          error: (error) => {
            console.error('Erro ao cadastrar exercício na API:', error);
            console.error('Resposta do erro:', error.error);
            this.exibirMensagem('erro', 'Imagem salva, mas erro ao cadastrar exercício na API.');
          },
        });
      },
      error: (error) => {
        console.error('Erro ao enviar imagem:', error);
        this.exibirMensagem('erro', 'Erro ao salvar imagem. Tente novamente.');
      },
    });
  }

  exibirMensagem(tipo: 'sucesso' | 'erro', texto: string): void {
    this.mensagem = { tipo, texto, visivel: true };
    // forçar atualização imediata da UI
    this.cdr.detectChanges();

    // se for sucesso, rolar a página para o topo para visibilidade da mensagem
    if (tipo === 'sucesso') {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }

    setTimeout(() => {
      this.mensagem.visivel = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  limparFormulario(): void {
    this.nomeImagem = '';
    this.imagemPreview = null;
    this.arquivoImagem = null;
  }
}
