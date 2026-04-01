import { Component, ChangeDetectorRef, NgZone, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

interface ApiExercicio {
  id: number;
  nome: string;
  descricao: string;
  musculoAlvo: string;
  musculosAuxiliares: string;
  diretorioImagem: string;
}

interface Exercise {
  id: number;
  exercicioId: number;
  name: string;
  reps: number;
  sets: number;
  rest: number;
  image: string;
  description: string;
}

interface Workout {
  title: string;
  description: string;
  targetMuscles: string;
  exercises: Exercise[];
}

interface Mensagem {
  tipo: 'sucesso' | 'erro';
  texto: string;
  visivel: boolean;
  saindo: boolean;
}

@Component({
  selector: 'app-cadastro-treino',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cadastro-treino.html',
  styleUrl: './cadastro-treino.css',
})
export class CadastroTreino implements OnInit {
  private apiUrl = 'https://fitbridge-exv.onrender.com/api';

  expandedCards: boolean[] = [];
  editingIndex: number | null = null;

  // Form inputs
  exercicioSelecionado: ApiExercicio | null = null;
  dropdownAberto: boolean = false;
  reps: number = 0;
  sets: number = 0;
  restTime: number = 0;

  // Edit
  editReps: number = 0;
  editSets: number = 0;
  editRestTime: number = 0;

  // Mensagem
  mensagem: Mensagem = {
    tipo: 'sucesso',
    texto: '',
    visivel: false,
    saindo: false,
  };

  // Dados do treino
  workout: Workout = {
    title: '',
    description: '',
    targetMuscles: '',
    exercises: [],
  };

  // Imagem do Treino
  nomeImagem: string = '';
  imagemPreview: string | null = null;
  arquivoImagem: File | null = null;

  // Exercícios carregados da API
  exerciciosDisponiveis: ApiExercicio[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.carregarExercicios();
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    this.arquivoImagem = file;
    this.nomeImagem = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.ngZone.run(() => {
        this.imagemPreview = reader.result as string;
      });
    };
    reader.readAsDataURL(file);
  }

  @HostListener('document:click')
  fecharDropdown(): void {
    this.dropdownAberto = false;
  }

  toggleDropdown(): void {
    this.dropdownAberto = !this.dropdownAberto;
  }

  selecionarExercicio(ex: ApiExercicio): void {
    this.exercicioSelecionado = ex;
    this.dropdownAberto = false;
  }

  getImagemUrl(diretorio: string): string {
    if (!diretorio) return '';
    if (diretorio.startsWith('/') || diretorio.startsWith('http')) return diretorio;
    return '/' + diretorio;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  carregarExercicios(): void {
    this.http.get<ApiExercicio[]>(`${this.apiUrl}/exercicios`).subscribe({
      next: (exercicios) => {
        this.exerciciosDisponiveis = exercicios;
      },
      error: (err) => {
        console.error('Erro ao carregar exercícios:', err);
        this.exibirMensagem('erro', 'Erro ao carregar exercícios da API. Verifique se o servidor está rodando.');
      },
    });
  }

  toggleCard(index: number, event: Event): void {
    event.stopPropagation();
    this.expandedCards[index] = !this.expandedCards[index];
  }

  isCardExpanded(index: number): boolean {
    return this.expandedCards[index] ?? false;
  }

  addExercise(): void {
    if (!this.exercicioSelecionado || this.reps <= 0 || this.sets <= 0 || this.restTime <= 0) {
      alert('Por favor, selecione um exercício e preencha todos os campos.');
      return;
    }

    const exercicio = this.exercicioSelecionado;
    const newExercise: Exercise = {
      id: this.workout.exercises.length + 1,
      exercicioId: exercicio.id,
      name: exercicio.nome,
      reps: this.reps,
      sets: this.sets,
      rest: this.restTime,
      image: this.getImagemUrl(exercicio.diretorioImagem) || '/exercises/biceps_apoiado.avif',
      description: exercicio.descricao,
    };

    this.workout.exercises.push(newExercise);
    this.expandedCards.push(false);

    this.exercicioSelecionado = null;
    this.reps = 0;
    this.sets = 0;
    this.restTime = 0;
  }

  removeExercise(index: number): void {
    this.workout.exercises.splice(index, 1);
    this.expandedCards.splice(index, 1);
  }

  saveWorkout(): void {
    if (!this.workout.title || this.workout.exercises.length === 0) {
      this.exibirMensagem('erro', 'Por favor, defina um título e adicione pelo menos um exercício ao treino.');
      return;
    }

    if (!this.arquivoImagem) {
      this.exibirMensagem('erro', 'Selecione uma imagem para o treino.');
      return;
    }

    const usuario = this.authService.getUsuarioLogado();
    if (!usuario) {
      this.exibirMensagem('erro', 'Usuário não está logado.');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.arquivoImagem);

    this.http.post<any>('/api/upload-workout-image', formData).subscribe({
      next: (response) => {
        const treinoDTO = {
          titulo: this.workout.title,
          grupoMuscular: this.workout.targetMuscles,
          descricao: this.workout.description,
          diretorioImagem: response.filePath,
          instrutorId: usuario.id,
          itens: this.workout.exercises.map(ex => ({
            exercicioId: ex.exercicioId,
            series: ex.sets,
            repeticoes: ex.reps,
          })),
        };

        this.http.post<any>(`${this.apiUrl}/treinos`, treinoDTO).subscribe({
          next: () => {
            this.exibirMensagem('sucesso', 'Treino "' + this.workout.title + '" cadastrado com sucesso!');

            setTimeout(() => {
              this.limparFormulario();
              this.cdr.detectChanges();
            }, 3500);
          },
          error: (error) => {
            console.error('Erro ao cadastrar treino:', error);
            this.exibirMensagem('erro', 'Imagem salva, mas erro ao cadastrar treino na API.');
          },
        });
      },
      error: (error) => {
        console.error('Erro ao enviar imagem:', error);
        this.exibirMensagem('erro', 'Erro ao salvar imagem. Tente novamente.');
      },
    });
  }

  limparFormulario(): void {
    this.workout = {
      title: '',
      description: '',
      targetMuscles: '',
      exercises: [],
    };
    this.expandedCards = [];
    this.exercicioSelecionado = null;
    this.dropdownAberto = false;
    this.reps = 0;
    this.sets = 0;
    this.restTime = 0;
    this.nomeImagem = '';
    this.imagemPreview = null;
    this.arquivoImagem = null;
  }

  exibirMensagem(tipo: 'sucesso' | 'erro', texto: string): void {
    this.mensagem = { tipo, texto, visivel: true, saindo: false };
    this.cdr.detectChanges();

    setTimeout(() => {
      this.mensagem.saindo = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.mensagem.visivel = false;
        this.mensagem.saindo = false;
        this.cdr.detectChanges();
      }, 400);
    }, 3500);
  }

  fecharMensagem(): void {
    this.mensagem.saindo = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mensagem.visivel = false;
      this.mensagem.saindo = false;
      this.cdr.detectChanges();
    }, 400);
  }

  startEdit(index: number): void {
    this.editingIndex = index;
    this.editReps = this.workout.exercises[index].reps;
    this.editSets = this.workout.exercises[index].sets;
    this.editRestTime = this.workout.exercises[index].rest;
  }

  cancelEdit(): void {
    this.editingIndex = null;
    this.editReps = 0;
    this.editSets = 0;
    this.editRestTime = 0;
  }

  saveEdit(index: number): void {
    if (this.editReps <= 0 || this.editSets <= 0 || this.editRestTime <= 0) {
      alert('Por favor, preencha todos os campos com valores maiores que zero.');
      return;
    }

    this.workout.exercises[index].reps = this.editReps;
    this.workout.exercises[index].sets = this.editSets;
    this.workout.exercises[index].rest = this.editRestTime;

    this.cancelEdit();
  }
}
