import { Routes } from '@angular/router';
import { LoginPage } from './pages/login-page/login-page';
import { HomePage } from './pages/home-page/home-page';
import { Layout } from './shared/components/layout/layout';
import { CreateGamePage } from './pages/create-game-page/create-game-page';
import { ConnectToGamePage } from './pages/connect-to-game-page/connect-to-game-page';
import { CardCollectionPage } from './pages/card-collection-page/card-collection-page';
import { ProfilePage } from './pages/profile-page/profile-page';
import { GamePage } from './pages/game-page/game-page';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      {
        path: '',
        component: HomePage,
      },
      {
        path: 'login',
        component: LoginPage,
      },
      {
        path: 'create-game',
        component: CreateGamePage,
      },
      {
        path: 'connect-to-game',
        component: ConnectToGamePage,
      },
      {
        path: 'card-collection',
        component: CardCollectionPage,
      },
      {
        path: 'profile',
        component: ProfilePage,
      },
      {
        path: 'game/:gameId',
        component: GamePage,
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
