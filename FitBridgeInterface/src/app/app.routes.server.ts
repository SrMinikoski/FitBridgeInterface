import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'home',
    renderMode: RenderMode.Client
  },
  {
    path: 'exercicios',
    renderMode: RenderMode.Client
  },
  {
    path: 'treinos',
    renderMode: RenderMode.Client
  },
  {
    path: 'cadastro-professor',
    renderMode: RenderMode.Client
  },
  {
    path: 'cadastro-exercicio',
    renderMode: RenderMode.Client
  },
  {
    path: 'cadastro-treino',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
