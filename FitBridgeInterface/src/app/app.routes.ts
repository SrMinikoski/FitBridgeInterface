import { Routes } from '@angular/router';
import { HomePage } from './home-page/home-page';
import { Workoutpage } from './workoutpage/workoutpage';
import { CadastroProf } from './cadastro-prof/cadastro-prof';
import { CadstroUser } from './cadstro-user/cadstro-user';
import { CadastroExercicio } from './cadastro-exercicio/cadastro-exercicio';
import { CadastroTreino } from './cadastro-treino/cadastro-treino';
import { ListaTreinos } from './lista-treinos/lista-treinos';
import { ListaExercicios } from './lista-exercicios/lista-exercicios';
import { Login } from './login/login';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Login,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'home',
    component: HomePage,
    canActivate: [AuthGuard],
  },
  {
    path: 'workout',
    component: Workoutpage,
  },
  {
    path: 'exercicios',
    component: ListaExercicios,
    canActivate: [AuthGuard],
  },
  {
    path: 'treinos',
    component: ListaTreinos,
    canActivate: [AuthGuard],
  },
  {
    path: 'cadastro-professor',
    component: CadastroProf,
    canActivate: [AuthGuard],
  },
  {
    path: 'cadastro-usuario',
    component: CadstroUser,
  },
  {
    path: 'cadastro-exercicio',
    component: CadastroExercicio,
    canActivate: [AuthGuard],
  },
  {
    path: 'cadastro-treino',
    component: CadastroTreino,
    canActivate: [AuthGuard],
  },
];
