import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { Router, RouterLink } from "@angular/router";
import { GameService } from '../../core/services/game-service/game-service';
import { catchError, firstValueFrom, interval, of, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Game } from '../../core/models/game';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SocketService } from '../../core/services/socket-service/socket-service';
import { AuthService } from '../../core/services/auth-service/auth-service';
import { StartGameBlockchainService } from '../../core/services/blockchain-services/start-game-blockchain-service';

@Component({
  selector: 'app-connect-to-game-page',
  imports: [
    FormsModule,
    MatButton,
    ReactiveFormsModule,
    RouterLink,
    MatProgressSpinner,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    MatCellDef,
    MatHeaderCellDef
  ],
  templateUrl: './connect-to-game-page.html',
  styleUrl: './connect-to-game-page.scss',
})
export class ConnectToGamePage implements OnDestroy {
  private readonly gameService = inject(GameService);
  private readonly socketService = inject(SocketService);
  private readonly authService = inject(AuthService);
  private readonly startGameBlockchainService = inject(StartGameBlockchainService);
  private readonly router = inject(Router);
  private destroy$ = new Subject<void>();
  private readonly snackBar = inject(MatSnackBar);

  games = signal<Game[]>([]);
  isLoading = signal(true);
  isJoining = signal(false);

  displayedColumns = ['id', 'creator', 'bid', 'reward', 'action'];

  constructor() {
    this.loadGamesPeriodically();
  }

  private loadGamesPeriodically() {
    interval(5_000)
      .pipe(
        startWith(0),
        switchMap(() => this.gameService.getPendingGames().pipe(
          catchError(err => {
            console.error('Failed to load games:', err);
            this.isLoading.set(false);
            return of([]);
          })
        )),
        tap(games => {
          this.games.set(games);
          this.isLoading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  async joinGame(gameId: number) {
    this.isJoining.set(true);

    this.isJoining.set(true);

    try {
      // await this.startGameBlockchainService.joinGameOnChain(gameId);

      const game = await firstValueFrom(this.gameService.connectToGame(gameId));
      this.socketService.connectToGame(game.id.toString(), this.authService.getJwtToken() || '');

      await this.router.navigate(['/game', game.id]);
    } catch (err: any) {
      this.isJoining.set(false);
      this.showMessage(err.message || 'Failed to join on-chain');
    }
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Ok', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
