import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
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
}

@Component({
  selector: 'app-cadastro-treino',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cadastro-treino.html',
  styleUrl: './cadastro-treino.css',
})
export class CadastroTreino implements OnInit {
  private apiUrl = 'http://localhost:8080/api';

  expandedCards: boolean[] = [];
  editingIndex: number | null = null;

  // Form inputs
  selectedExercise: string = '';
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
  };

  // Dados do treino
  workout: Workout = {
    title: '',
    description: '',
    targetMuscles: '',
    exercises: [],
  };

  // Exercícios carregados da API
  exerciciosDisponiveis: ApiExercicio[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.carregarExercicios();
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
    if (!this.selectedExercise || this.reps <= 0 || this.sets <= 0 || this.restTime <= 0) {
      alert('Por favor, preencha todos os campos do exercício.');
      return;
    }

    const exercicio = this.exerciciosDisponiveis.find(e => e.id.toString() === this.selectedExercise);
    if (exercicio) {
      const newExercise: Exercise = {
        id: this.workout.exercises.length + 1,
        exercicioId: exercicio.id,
        name: exercicio.nome,
        reps: this.reps,
        sets: this.sets,
        rest: this.restTime,
        image: exercicio.diretorioImagem || '/exercises/biceps_apoiado.avif',
        description: exercicio.descricao,
      };

      this.workout.exercises.push(newExercise);
      this.expandedCards.push(false);

      this.selectedExercise = '';
      this.reps = 0;
      this.sets = 0;
      this.restTime = 0;
    }
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

    const usuario = this.authService.getUsuarioLogado();
    if (!usuario) {
      this.exibirMensagem('erro', 'Usuário não está logado.');
      return;
    }

    const treinoDTO = {
      titulo: this.workout.title,
      grupoMuscular: this.workout.targetMuscles,
      descricao: this.workout.description,
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
        this.exibirMensagem('erro', 'Erro ao cadastrar treino. Tente novamente.');
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
    this.selectedExercise = '';
    this.reps = 0;
    this.sets = 0;
    this.restTime = 0;
  }

  exibirMensagem(tipo: 'sucesso' | 'erro', texto: string): void {
    this.mensagem = { tipo, texto, visivel: true };
    // forçar atualização imediata da UI
    this.cdr.detectChanges();

    // Limpar mensagem após 3 segundos
    setTimeout(() => {
      this.mensagem.visivel = false;
      this.cdr.detectChanges();
    }, 3000);
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
