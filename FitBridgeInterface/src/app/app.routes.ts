import { Routes } from '@angular/router';
import { HomePage } from './home-page/home-page';
import { Workoutpage } from './workoutpage/workoutpage';
import { CadastroProf } from './cadastro-prof/cadastro-prof';
import { CadstroUser } from './cadstro-user/cadstro-user';

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
    path: 'cadastro-professor',
    component: CadastroProf,
  },
  {
    path: 'cadastro-usuario',
    component: CadstroUser,
  },
];
