import { Component, ChangeDetectorRef, NgZone, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
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
  usarUrlImagem: boolean = false;
  urlImagem: string = '';

  // Exercícios carregados da API
  exerciciosDisponiveis: ApiExercicio[] = [];
  exerciciosFiltrados: ApiExercicio[] = [];
  buscaExercicio: string = '';

  // Modo edição
  editId: number | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarExercicios();
    this.route.queryParams.subscribe(params => {
      const editId = params['editId'];
      if (editId) {
        this.editId = +editId;
        this.carregarTreinoPorId(this.editId);
      }
    });
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

  onUrlChange(): void {
    if (this.urlImagem.trim()) {
      this.imagemPreview = this.urlImagem;
      this.nomeImagem = '';
    }
  }

  toggleImageMode(): void {
    this.usarUrlImagem = !this.usarUrlImagem;
    if (this.usarUrlImagem) {
      // Modo URL
      this.arquivoImagem = null;
      this.nomeImagem = '';
    } else {
      // Modo upload
      this.urlImagem = '';
    }
    this.imagemPreview = null;
  }

  @HostListener('document:click')
  fecharDropdown(): void {
    this.dropdownAberto = false;
  }

  toggleDropdown(): void {
    this.dropdownAberto = !this.dropdownAberto;
    if (this.dropdownAberto) {
      this.buscaExercicio = '';
      this.exerciciosFiltrados = [...this.exerciciosDisponiveis];
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>('.dropdown-search-input');
        input?.focus();
      }, 50);
    }
  }

  selecionarExercicio(ex: ApiExercicio): void {
    this.exercicioSelecionado = ex;
    this.dropdownAberto = false;
    this.buscaExercicio = '';
    this.exerciciosFiltrados = [...this.exerciciosDisponiveis];
  }

  private normalizar(texto: string): string {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  filtrarExercicios(): void {
    const termo = this.normalizar(this.buscaExercicio.trim());
    if (!termo) {
      this.exerciciosFiltrados = [...this.exerciciosDisponiveis];
      return;
    }
    this.exerciciosFiltrados = this.exerciciosDisponiveis.filter(ex =>
      this.normalizar(ex.nome).includes(termo) ||
      this.normalizar(ex.musculoAlvo).includes(termo)
    );
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

  carregarTreinoPorId(id: number): void {
    this.http.get<any>(`${this.apiUrl}/treinos/${id}`).subscribe({
      next: (treino) => {
        this.workout.title = treino.titulo;
        this.workout.description = treino.descricao;
        this.workout.targetMuscles = treino.grupoMuscular;

        if (treino.diretorioImagem) {
          this.usarUrlImagem = true;
          this.urlImagem = treino.diretorioImagem;
          this.imagemPreview = this.getImagemUrl(treino.diretorioImagem);
        }

        if (treino.itens?.length) {
          this.workout.exercises = treino.itens.map((item: any, index: number) => ({
            id: index + 1,
            exercicioId: item.exercicio.id,
            name: item.exercicio.nome,
            reps: item.repeticoes,
            sets: item.series,
            rest: 60,
            image: this.getImagemUrl(item.exercicio.diretorioImagem || ''),
            description: item.exercicio.descricao,
          }));
          this.expandedCards = this.workout.exercises.map(() => false);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar treino para edição:', err);
        this.exibirMensagem('erro', 'Erro ao carregar dados do treino.');
      },
    });
  }

  carregarExercicios(): void {
    this.http.get<ApiExercicio[]>(`${this.apiUrl}/exercicios`).subscribe({
      next: (exercicios) => {
        this.exerciciosDisponiveis = exercicios;
        this.exerciciosFiltrados = [...exercicios];
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

    if (!this.usarUrlImagem && !this.arquivoImagem) {
      this.exibirMensagem('erro', 'Selecione uma imagem para o treino.');
      return;
    }

    if (this.usarUrlImagem && !this.urlImagem.trim()) {
      this.exibirMensagem('erro', 'Insira uma URL válida para a imagem.');
      return;
    }

    const usuario = this.authService.getUsuarioLogado();
    if (!usuario) {
      this.exibirMensagem('erro', 'Usuário não está logado.');
      return;
    }

    const salvarTreino = (caminhoImagem: string) => {
      const treinoDTO = {
        titulo: this.workout.title,
        grupoMuscular: this.workout.targetMuscles,
        descricao: this.workout.description,
        diretorioImagem: caminhoImagem,
        instrutorId: usuario.id,
        itens: this.workout.exercises.map(ex => ({
          exercicioId: ex.exercicioId,
          series: ex.sets,
          repeticoes: ex.reps,
        })),
      };

      console.log('Enviando dados do treino:', treinoDTO);

      const handleErroSalvar = (error: any) => {
        console.error('Erro ao salvar treino:', error);
        const mensagemApi = error?.error?.message || error?.error?.erro || error?.error?.error;
        const mensagemFinal = mensagemApi
          ? `Erro: ${mensagemApi}`
          : `Erro ao salvar treino (código ${error?.status ?? 'desconhecido'}).`;
        this.exibirMensagem('erro', mensagemFinal);
      };

      const criarTreino = () => {
        this.http.post<any>(`${this.apiUrl}/treinos`, treinoDTO).subscribe({
          next: () => {
            const msg = this.editId
              ? `Treino "${this.workout.title}" atualizado com sucesso!`
              : `Treino "${this.workout.title}" cadastrado com sucesso!`;
            this.exibirMensagem('sucesso', msg);
            setTimeout(() => {
              if (this.editId) {
                this.router.navigate(['/treinos']);
              } else {
                this.limparFormulario();
              }
              this.cdr.detectChanges();
            }, 3500);
          },
          error: handleErroSalvar,
        });
      };

      if (this.editId) {
        // A API não suporta PUT/PATCH em /treinos/:id (apenas GET e DELETE).
        // Workaround: deletar o treino antigo e criar um novo com os dados atualizados.
        this.http.delete<void>(`${this.apiUrl}/treinos/${this.editId}`).subscribe({
          next: () => criarTreino(),
          error: (error) => {
            console.error('Erro ao remover treino antigo:', error);
            this.exibirMensagem('erro', 'Erro ao atualizar o treino. Tente novamente.');
          },
        });
      } else {
        criarTreino();
      }
    };

    if (this.usarUrlImagem) {
      // Modo URL: salvar treino diretamente com a URL
      salvarTreino(this.urlImagem);
    } else {
      // Modo Upload: fazer upload e depois salvar treino
      const formData = new FormData();
      formData.append('file', this.arquivoImagem!);

      this.http.post<any>('/api/upload-workout-image', formData).subscribe({
        next: (response) => {
          console.log('Resposta do upload:', response);
          salvarTreino(response.filePath);
        },
        error: (error) => {
          console.error('Erro ao enviar imagem:', error);
          const mensagemApi = error?.error?.message || error?.error?.erro || error?.error?.error;
          const mensagemFinal = mensagemApi
            ? `Erro ao salvar imagem: ${mensagemApi}`
            : `Erro ao salvar imagem (código ${error?.status ?? 'desconhecido'}).`;
          this.exibirMensagem('erro', mensagemFinal);
        },
      });
    }
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
    this.urlImagem = '';
    this.usarUrlImagem = false;
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
