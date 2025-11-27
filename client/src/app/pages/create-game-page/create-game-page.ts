import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ICreateGameForm } from './create-game-form';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { SocketService } from '../../core/services/socket-service/socket-service';
import { GameService } from '../../core/services/game-service/game-service';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth-service/auth-service';

@Component({
  selector: 'app-create-game-page',
  imports: [
    MatButton,
    RouterLink,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError
  ],
  templateUrl: './create-game-page.html',
  styleUrl: './create-game-page.scss',
})
export class CreateGamePage implements OnDestroy {
  private readonly snackBar = inject(MatSnackBar);
  private readonly gameService = inject(GameService);
  private readonly socketService = inject(SocketService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  waitingForPlayer = signal(false);
  createdGameId = signal<number | null>(null);

  createGameForm = new FormGroup<ICreateGameForm>({
    bid: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  onSubmit() {
    if (this.createGameForm.invalid || this.waitingForPlayer()) {
      this.createGameForm.markAllAsTouched();
      return;
    }

    const bid = this.createGameForm.value.bid!;

    this.gameService.createGame(bid).subscribe({
      next: (game) => {
        this.createdGameId.set(game.id);
        this.waitingForPlayer.set(true);

        const jwt = this.authService.getJwtToken() || '';

        this.socketService.connectToGame(game.id.toString(), jwt);

        this.showMessage(`Game #${game.id} created! Waiting for opponent...`);

        this.socketService.status$
          .pipe(
            filter(status => status === 'connected'),
            takeUntil(this.destroy$)
          )
          .subscribe(() => {
            console.log('[CreateGame] Socket connected → listening for game_started');

            this.socketService.on('game_started')
              .pipe(takeUntil(this.destroy$))
              .subscribe(() => {
                console.log('%c[CreateGame] Game started! Redirecting...', 'color: lime');
                this.router.navigate(['/game', game.id]);
              });
          });
      },
      error: (err: HttpErrorResponse) => {
        this.waitingForPlayer.set(false);
        this.createdGameId.set(null);
        this.showMessage(err.error?.detail || 'Failed to create game');
      }
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
