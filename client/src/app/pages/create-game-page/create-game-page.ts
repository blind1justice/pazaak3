import { Component, inject, OnDestroy, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ICreateGameForm } from './create-game-form';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SocketService } from '../../core/services/socket-service/socket-service';
import { GameService } from '../../core/services/game-service/game-service';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth-service/auth-service';
import { StartGameBlockchainService } from '../../core/services/blockchain-services/start-game-blockchain-service';

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
  private readonly startGameBlockchainService = inject(StartGameBlockchainService);
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

  async onSubmit() {
    if (this.createGameForm.invalid || this.waitingForPlayer()) {
      this.createGameForm.markAllAsTouched();
      return;
    }

    const bid = this.createGameForm.value.bid!;


    this.waitingForPlayer.set(true);

    try {
      // const roomId = await this.startGameBlockchainService.createGameOnChain(bid);

      const game = await firstValueFrom(this.gameService.createGame(bid));
      this.createdGameId.set(game.id);

      this.socketService.connectToGame(game.id.toString(), this.authService.getJwtToken() || '');
      this.showMessage(`Game #${game.id} created on-chain! Waiting...`);

      this.socketService.on('game_started').pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.router.navigate(['/game', game.id]);
      });
    } catch (err: any) {
      this.waitingForPlayer.set(false);
      this.showMessage(err.message || 'Blockchain transaction failed');
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
