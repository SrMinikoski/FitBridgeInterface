import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navigation } from '../navigation/navigation';

interface Treino {
  id: number;
  titulo: string;
  descricao: string;
  gruposMusculares: string;
  objetivo: string;
  generoRecomendado: string;
  imagemCapa: string;
  totalExercicios: number;
  dataPublicacao: string;
}

@Component({
  selector: 'app-lista-treinos',
  standalone: true,
  imports: [CommonModule, FormsModule, Navigation],
  templateUrl: './lista-treinos.html',
  styleUrl: './lista-treinos.css',
})
export class ListaTreinos implements OnInit {
  treinosFiltrados: Treino[] = [];
  termoBusca: string = '';

  // Dados mockados - Serão substituídos por dados da API
  treinosMockados: Treino[] = [
    {
      id: 1,
      titulo: 'Treino de Peito e Tríceps',
      descricao: 'Treino focado no desenvolvimento do peitoral e tríceps com exercícios compostos.',
      gruposMusculares: 'Peito, Tríceps, Ombros',
      objetivo: 'Ganho de Massa Muscular',
      generoRecomendado: 'Todos',
      imagemCapa: '/workouts/peito-triceps.jpg',
      totalExercicios: 6,
      dataPublicacao: '2026-03-15',
    },
    {
      id: 2,
      titulo: 'Treino de Costas e Bíceps',
      descricao: 'Treino completo para costas com foco em desenvolvimento de bíceps.',
      gruposMusculares: 'Costas, Bíceps, Ombros',
      objetivo: 'Ganho de Massa Muscular',
      generoRecomendado: 'Todos',
      imagemCapa: '/workouts/costas-biceps.jpg',
      totalExercicios: 7,
      dataPublicacao: '2026-03-14',
    },
    {
      id: 3,
      titulo: 'Treino de Pernas Intenso',
      descricao: 'Treino pesado focado em quadríceps, posterior de coxa e glúteos.',
      gruposMusculares: 'Pernas, Glúteos, Quadríceps',
      objetivo: 'Ganho de Massa Muscular',
      generoRecomendado: 'Todos',
      imagemCapa: '/workouts/pernas.jpg',
      totalExercicios: 8,
      dataPublicacao: '2026-03-13',
    },
    {
      id: 4,
      titulo: 'Treino Full Body',
      descricao: 'Treino que trabalha todo o corpo em uma única sessão com ênfase em movimentos compostos.',
      gruposMusculares: 'Todo Corpo',
      objetivo: 'Força',
      generoRecomendado: 'Todos',
      imagemCapa: '/workouts/fullbody.jpg',
      totalExercicios: 10,
      dataPublicacao: '2026-03-12',
    },
    {
      id: 5,
      titulo: 'Treino de Ombros',
      descricao: 'Treino especializado para desenvolvimento completo dos ombros.',
      gruposMusculares: 'Ombros, Trapézio',
      objetivo: 'Ganho de Massa Muscular',
      generoRecomendado: 'Masculino',
      imagemCapa: '/workouts/ombros.jpg',
      totalExercicios: 5,
      dataPublicacao: '2026-03-11',
    },
    {
      id: 6,
      titulo: 'Cardio e Definição',
      descricao: 'Treino focado em queima de calorias e definição muscular.',
      gruposMusculares: 'Todo Corpo',
      objetivo: 'Perda de Peso',
      generoRecomendado: 'Todos',
      imagemCapa: '/workouts/cardio.jpg',
      totalExercicios: 8,
      dataPublicacao: '2026-03-10',
    },
    {
      id: 7,
      titulo: 'Treino para Força Máxima',
      descricao: 'Treino de força com cargas pesadas e baixas repetições.',
      gruposMusculares: 'Todo Corpo',
      objetivo: 'Força',
      generoRecomendado: 'Masculino',
      imagemCapa: '/workouts/forca.jpg',
      totalExercicios: 6,
      dataPublicacao: '2026-03-09',
    },
    {
      id: 8,
      titulo: 'Treino Feminino - Glúteos',
      descricao: 'Treino focado em desenvolvimento de glúteos e pernas.',
      gruposMusculares: 'Glúteos, Pernas',
      objetivo: 'Ganho de Massa Muscular',
      generoRecomendado: 'Feminino',
      imagemCapa: '/workouts/gluteos.jpg',
      totalExercicios: 7,
      dataPublicacao: '2026-03-08',
    },
  ];

  ngOnInit(): void {
    this.carregarTreinos();
  }

  /**
   * Carrega os treinos
   * Será substituído por chamada à API
   */
  carregarTreinos(): void {
    // TODO: Substituir por chamada HTTP quando API estiver disponível
    // this.treinoService.obterTreinos().subscribe(
    //   (treinos: Treino[]) => {
    //     this.treinosMockados = treinos;
    //     this.atualizarFiltro();
    //   },
    //   (error) => {
    //     console.error('Erro ao carregar treinos:', error);
    //   }
    // );
    this.atualizarFiltro();
  }

  /**
   * Filtra os treinos baseado no termo de busca
   * Busca por título, descrição e grupos musculares
   */
  atualizarFiltro(): void {
    if (!this.termoBusca.trim()) {
      this.treinosFiltrados = [...this.treinosMockados];
    } else {
      const termo = this.termoBusca.toLowerCase();
      this.treinosFiltrados = this.treinosMockados.filter((treino) =>
        treino.titulo.toLowerCase().includes(termo) ||
        treino.descricao.toLowerCase().includes(termo) ||
        treino.gruposMusculares.toLowerCase().includes(termo)
      );
    }
  }

  /**
   * Chamado quando o usuário digita na barra de pesquisa
   */
  onBuscaChange(): void {
    this.atualizarFiltro();
  }

  /**
   * Abre o treino selecionado
   * Será substituído por navegação para tela de detalhes do treino
   */
  selecionarTreino(treino: Treino): void {
    console.log('Treino selecionado:', treino);
    // TODO: Navegar para a página de detalhes do treino
    // this.router.navigate(['/treino', treino.id]);
  }

  /**
   * Formata a data de publicação
   */
  formatarData(dataString: string): string {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
