import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { Layout } from './shared/components/layout/layout';
import { CreateGamePage } from './pages/create-game-page/create-game-page';
import { ConnectToGamePage } from './pages/connect-to-game-page/connect-to-game-page';
import { CardCollectionPage } from './pages/card-collection-page/card-collection-page';
import { ProfilePage } from './pages/profile-page/profile-page';
import { GamePage } from './pages/game-page/game-page';
import { LoginPage } from './pages/login-page/login-page';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      {
        path: '',
        component: HomePage,
        pathMatch: 'full',
        canMatch: [authGuard],
      },
      {
        path: 'login',
        component: LoginPage,
      },
      {
        path: 'create-game',
        component: CreateGamePage,
        canMatch: [authGuard],
      },
      {
        path: 'connect-to-game',
        component: ConnectToGamePage,
        canMatch: [authGuard],
      },
      {
        path: 'card-collection',
        component: CardCollectionPage,
        canMatch: [authGuard],
      },
      {
        path: 'profile',
        component: ProfilePage,
        canMatch: [authGuard],
      },
      {
        path: 'game/:gameId',
        component: GamePage,
        canMatch: [authGuard],
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
