import { Routes } from '@angular/router';
import { HomePage } from './home-page/home-page';
import { Workoutpage } from './workoutpage/workoutpage';
import { CadastroProf } from './cadastro-prof/cadastro-prof';
import { CadstroUser } from './cadstro-user/cadstro-user';
import { CadastroExercicio } from './cadastro-exercicio/cadastro-exercicio';
import { CadastroTreino } from './cadastro-treino/cadastro-treino';
import { ListaTreinos } from './lista-treinos/lista-treinos';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'home',
    component: HomePage,
  },
  {
    path: 'workout',
    component: Workoutpage,
  },
  {
    path: 'treinos',
    component: ListaTreinos,
  },
  {
    path: 'cadastro-professor',
    component: CadastroProf,
  },
  {
    path: 'cadastro-usuario',
    component: CadstroUser,
  },
  {
    path: 'cadastro-exercicio',
    component: CadastroExercicio,
  },
  {
    path: 'cadastro-treino',
    component: CadastroTreino,
  },
];
