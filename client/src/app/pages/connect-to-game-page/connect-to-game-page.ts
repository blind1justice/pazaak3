import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { Router, RouterLink } from "@angular/router";
import { GameService } from '../../core/services/game-service/game-service';
import { catchError, interval, of, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
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

  joinGame(gameId: number) {
    this.isJoining.set(true);

    this.gameService.connectToGame(gameId).subscribe({
      next: (game) => {
        this.socketService.connectToGame(
          game.id.toString(),
          this.authService.getJwtToken() || '',
        );

        this.router.navigate(['/game', game.id]);
      },
      error: (err) => {
        this.isJoining.set(false);
        this.showMessage(err.error?.detail || 'Failed to join game');
      },
      complete: () => {
        this.isJoining.set(false);
      },
    });
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
