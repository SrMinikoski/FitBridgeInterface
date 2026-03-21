import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Exercise {
  id: number;
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
  recommendedGender: string;
  objective: string;
  coverImage: string;
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
export class CadastroTreino {
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

  // Imagem de capa
  nomeImagem: string = '';
  imagemPreview: string | null = null;
  caminhoImagem: string = '';
  arquivoImagem: File | null = null;

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
    recommendedGender: '',
    objective: '',
    coverImage: '',
    exercises: [],
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  // Exercícios da API serão substituídos por dados mockados para desenvolvimento posteriormente
  mockExercises = [
    {
      id: 1,
      name: 'Supino Reto',
      description:
        'Exercício de pressão para peitoral. Deite-se no supino com os pés apoiados no chão. Segure o haltere ao nível do peitoral e empurre para cima até a extensão completa dos braços.',
      image: '/exercises/biceps_apoiado.avif',
    },
    {
      id: 2,
      name: 'Rosca Direta',
      description:
        'Exercício de flexão do cotovelo para bíceps. De pé, com os halteres nas mãos e os braços estendidos ao longo do corpo, flexione os cotovelos elevando os halteres até a altura dos ombros.',
      image: '/exercises/biceps_apoiado.avif',
    },
    {
      id: 3,
      name: 'Flexão de Pernas',
      description:
        'Exercício para quadríceps utilizando máquina de leg press. Sente-se na máquina, posicione os pés no mecanismo de empurra e estenda as pernas.',
      image: '/exercises/biceps_apoiado.avif',
    },
    {
      id: 4,
      name: 'Desenvolvimento com Haltere',
      description:
        'Exercício para ombros. Sentado ou de pé, com haltere na altura dos ombros, empurre para cima até a extensão completa dos braços.',
      image: '/exercises/biceps_apoiado.avif',
    },
    {
      id: 5,
      name: 'Puxada na Frente',
      description:
        'Exercício para costas. Sentado na máquina, puxe a barra em direção ao peitoral, contraindo o músculo do dorso.',
      image: '/exercises/biceps_apoiado.avif',
    },
  ];

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

    const exercise = this.mockExercises.find(e => e.id.toString() === this.selectedExercise);
    if (exercise) {
      const newExercise: Exercise = {
        id: this.workout.exercises.length + 1,
        name: exercise.name,
        reps: this.reps,
        sets: this.sets,
        rest: this.restTime,
        image: exercise.image,
        description: exercise.description,
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

    if (!this.arquivoImagem) {
      this.exibirMensagem('erro', 'Selecione uma imagem de capa para o treino.');
      return;
    }

    // Enviar imagem para o servidor salvar em public/workouts/
    const formData = new FormData();
    formData.append('file', this.arquivoImagem);

    this.http.post<any>('/api/upload-workout-image', formData).subscribe({
      next: (response) => {
        this.caminhoImagem = response.filePath;
        this.workout.coverImage = this.caminhoImagem;

        console.log('Treino salvo:', this.workout);
        console.log('Imagem de capa salva em: public/workouts/' + response.nomeArquivo);

        this.exibirMensagem('sucesso', 'Treino "' + this.workout.title + '" cadastrado com sucesso!');

        // Aguardar 3 segundos antes de limpar (mensagem desaparece em 3 segundos)
        setTimeout(() => {
          this.limparFormulario();
          this.cdr.detectChanges();
        }, 3500);
      },
      error: (error) => {
        console.error('Erro ao enviar imagem:', error);
        this.exibirMensagem('erro', 'Erro ao salvar imagem. Tente novamente.');
      },
    });
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    this.arquivoImagem = file;
    this.nomeImagem = file.name;

    // Criar preview da imagem IMEDIATAMENTE
    const reader = new FileReader();
    reader.onload = () => {
      this.imagemPreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  limparFormulario(): void {
    this.workout = {
      title: '',
      description: '',
      targetMuscles: '',
      recommendedGender: '',
      objective: '',
      coverImage: '',
      exercises: [],
    };
    this.expandedCards = [];
    this.nomeImagem = '';
    this.imagemPreview = null;
    this.caminhoImagem = '';
    this.arquivoImagem = null;
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
