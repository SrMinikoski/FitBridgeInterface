import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Navigation } from '../navigation/navigation';
import { TreinoService, Treino } from '../services/treino.service';
import { FavoritosService } from '../services/favoritos.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-lista-treinos',
  standalone: true,
  imports: [CommonModule, FormsModule, Navigation],
  templateUrl: './lista-treinos.html',
  styleUrl: './lista-treinos.css',
})
export class ListaTreinos implements OnInit, OnDestroy {
  treinosFiltrados = signal<Treino[]>([]);
  termoBusca: string = '';
  treinosCarregados = signal(false);
  carregando = signal(false);
  erro = signal<string | null>(null);
  filtroFavoritos = signal(false);

  private destroy$ = new Subject<void>();
  private treinosMockados: Treino[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private treinoService: TreinoService,
    private favoritosService: FavoritosService
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        // Verifica se há um parâmetro de busca vindo da página inicial
        if (params['busca']) {
          this.termoBusca = params['busca'];
        }
        
        this.filtroFavoritos.set(params['favoritos'] === 'true');
        if (this.treinosMockados.length) {
          this.atualizarFiltro();
        }
      });
    this.carregarTreinos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega os treinos da API
   */
  carregarTreinos(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.treinoService.obterTreinos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (treinos: Treino[]) => {
          this.treinosMockados = treinos;
          this.atualizarFiltro();
          this.treinosCarregados.set(true);
          this.carregando.set(false);
        },
        error: (error) => {
          console.error('Erro ao carregar treinos:', error);
          this.erro.set('Erro ao carregar treinos. Tente novamente.');
          this.carregando.set(false);
          this.treinosCarregados.set(true);
        }
      });
  }

  /**
   * Filtra os treinos baseado no termo de busca
   * Busca por título, descrição e grupos musculares
   */
  atualizarFiltro(): void {
    let resultado = [...this.treinosMockados];

    if (this.filtroFavoritos()) {
      const favIds = this.favoritosService.obterFavoritosIds();
      resultado = resultado.filter(t => favIds.includes(t.id));
    }

    if (this.termoBusca.trim()) {
      const termo = this.termoBusca.toLowerCase();
      resultado = resultado.filter((treino) =>
        treino.titulo.toLowerCase().includes(termo) ||
        treino.descricao.toLowerCase().includes(termo) ||
        (treino.grupoMuscular?.toLowerCase().includes(termo) ?? false)
      );
    }

    this.treinosFiltrados.set(resultado);
  }

  limparFiltroFavoritos(): void {
    this.filtroFavoritos.set(false);
    this.router.navigate([], { queryParams: {} });
    this.atualizarFiltro();
  }

  /**
   * Chamado quando o usuário digita na barra de pesquisa
   */
  onBuscaChange(): void {
    this.atualizarFiltro();
  }

  /**
   * Abre o treino selecionado
   * Navega para a página de detalhes do treino ou workout
   */
  selecionarTreino(treino: Treino): void {
    console.log('Treino selecionado:', treino);
    this.router.navigate(['/workout'], { queryParams: { id: treino.id } });
  }

  /**
   * Constrói a URL da imagem do treino
   * Usa diretorioImagem se disponível, caso contrário usa fallback
   */
  obterUrlImagem(treino: Treino): string | null {
    // 1. Imagem do próprio treino
    if (treino.diretorioImagem) {
      return '/' + treino.diretorioImagem;
    }

    // 2. Imagem do primeiro exercício que tenha uma
    if (treino.itens?.length) {
      for (const item of treino.itens) {
        if (item.exercicio?.diretorioImagem) {
          return '/' + item.exercicio.diretorioImagem;
        }
      }
    }

    // 3. Sem imagem disponível
    return null;
  }
}
