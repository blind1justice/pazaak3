import { Component, inject, OnInit } from '@angular/core';
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
export class CreateGamePage implements OnInit {

  private readonly snackBar = inject(MatSnackBar);
  private readonly gameService = inject(GameService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);

  createGameForm = new FormGroup<ICreateGameForm>({
    bid: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  ngOnInit(): void {
    this.socketService.on<{ gameId: "123" }>('startGame').subscribe((data) => {
      console.log(data);
      this.router.navigate(['/game', data.gameId]);
    });
  }

  onSubmit() {
    if (this.createGameForm.valid) {
      const formValue = this.createGameForm.value;

      this.gameService.createGame(Number(formValue.bid)).subscribe({
        next: (room) => {
          this.showMessage(`Room with number '${room.id}' was successfully created`);
        },
        error: (err: HttpErrorResponse) => {
          this.showMessage(err.error.detail || 'An error occurred while creating the room');
        }
      });
    } else {
      this.createGameForm.markAllAsTouched();
      return;
    }
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Ok', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
