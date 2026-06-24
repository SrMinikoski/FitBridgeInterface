import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Navigation } from '../navigation/navigation';
import { TreinoService, Treino } from '../services/treino.service';
import { FavoritosService } from '../services/favoritos.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { inject } from '@angular/core';

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

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    img.parentElement?.classList.add('placeholder-ativo');
  }

  /**
   * Normaliza URLs de imagem
   * Se for URL absoluta (http/https), retorna como está
   * Se for relativa, adiciona barra no início
   */
  private normalizarUrlImagem(url: string | undefined | null): string | null {
    if (!url) return null;
    
    console.log('>>> NORMALIZANDO URL <<<', url);
    
    // PRIMEIRO: Verifica se já começa com protocolo (http/https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('✓ JÁ ABSOLUTA:', url);
      return url;
    }
    
    // DEPOIS: Se começa com barra, remove e verifica novamente
    if (url.startsWith('/')) {
      const urlSemBarra = url.substring(1);
      console.log('Verificando após remover barra:', urlSemBarra);
      if (urlSemBarra.startsWith('http://') || urlSemBarra.startsWith('https://')) {
        console.log('✓ ERA /https:// AGORA CORRIGIDA:', urlSemBarra);
        return urlSemBarra;
      }
    }
    
    // Se for relativa, adiciona barra
    const urlFinal = '/' + url;
    console.log('✓ RELATIVA - ADICIONANDO BARRA:', urlFinal);
    return urlFinal;
  }

  /**
   * Constrói a URL da imagem do treino
   * Usa diretorioImagem se disponível, caso contrário usa fallback
   */
  obterUrlImagem(treino: Treino): string | null {
    console.log('>>> OBTER URL IMAGEM CHAMADO <<<', treino.titulo, 'diretorioImagem:', treino.diretorioImagem);
    
    // 1. Imagem do próprio treino
    if (treino.diretorioImagem) {
      const urlNormalizada = this.normalizarUrlImagem(treino.diretorioImagem);
      console.log('>>> RETORNANDO URL NORMALIZADA:', urlNormalizada);
      return urlNormalizada;
    }

    // 2. Imagem do primeiro exercício que tenha uma
    if (treino.itens?.length) {
      for (const item of treino.itens) {
        if (item.exercicio?.diretorioImagem) {
          return this.normalizarUrlImagem(item.exercicio.diretorioImagem);
        }
      }
    }

    // Tenta buscar do diretório público usando o grupo muscular
    const dirGropoMuscular = treino.grupoMuscular?.toLowerCase().replace(/\s+/g, '_');
    if (dirGropoMuscular) {
      const urlFallback = `/workouts/${dirGropoMuscular}.avif`;
      console.log('Tentando fallback:', urlFallback);
      return urlFallback;
    }

    console.log('Nenhuma imagem disponível para treino:', treino.titulo);
    // 3. Sem imagem disponível
    return null;
  }

  /**
   * Retorna uma cor de fundo baseada no grupo muscular
   */
  obterCorGrupoMuscular(grupoMuscular?: string): string {
    if (!grupoMuscular) return '#8F3A33';
    
    const grupo = grupoMuscular.toLowerCase();
    const cores: { [key: string]: string } = {
      'peito': '#E0332B',
      'costas': '#C41E3A',
      'pernas': '#8F3A33',
      'braços': '#FF6B6B',
      'ombros': '#FFB6B6',
      'core': '#FFD4D4',
      'glúteos': '#E67E7E',
      'tríceps': '#FF8888',
      'bíceps': '#E66666',
      'superior': '#D45555',
      'inferior': '#8F3A33',
      'completo': '#B83D3D'
    };
    
    // Busca a cor por palavra-chave
    for (const [chave, cor] of Object.entries(cores)) {
      if (grupo.includes(chave)) {
        return cor;
      }
    }
    
    return '#8F3A33';
  }

  /**
   * Deleta um treino após confirmação do usuário
   */
  deletarTreino(treino: Treino, event: Event): void {
    event.stopPropagation();
    
    const confirmacao = confirm(`Tem certeza que deseja excluir o treino "${treino.titulo}"? Esta ação não pode ser desfeita.`);
    
    if (confirmacao) {
      this.carregando.set(true);
      this.treinoService.deletarTreino(treino.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.carregarTreinos();
          },
          error: (error) => {
            console.error('Erro ao deletar treino:', error);
            this.carregando.set(false);
            alert('Erro ao excluir o treino. Tente novamente.');
          }
        });
    }
  }
}
