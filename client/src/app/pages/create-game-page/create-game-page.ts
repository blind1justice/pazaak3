import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ICreateGameForm } from './create-game-form';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateRoomDto } from '../../core/models/create-room-dto';
import { HttpErrorResponse } from '@angular/common/http';
import { RoomsService } from '../../core/services/rooms-service/rooms-service';

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
export class CreateGamePage {

  private readonly snackBar = inject(MatSnackBar);
  private readonly roomsService = inject(RoomsService);

  createGameForm = new FormGroup<ICreateGameForm>({
    roomNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    bid: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  onSubmit() {
    if (this.createGameForm.valid) {
      const formValue = this.createGameForm.value;
      const createRoomDto: CreateRoomDto = {
        number: formValue.roomNumber!,
        bid: formValue.bid!,
      };

      this.roomsService.createRoom(createRoomDto).subscribe({
        next: (room) => {
          this.showMessage(`Room with number '${room.number}' was successfully created`);
        },
        error: (err: HttpErrorResponse) => {
          this.showMessage(err.error.detail || 'An error occurred while creating the room');
        }
      });
    }
    else {
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
