import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatError, MatFormField } from "@angular/material/form-field";
import { MatInput, MatLabel } from "@angular/material/input";
import { Router, RouterLink } from "@angular/router";
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoomsService } from '../../core/services/rooms-service/rooms-service';
import { HttpErrorResponse } from '@angular/common/http';
import { IConnectToGameForm } from './connect-to-game-form';
import { ConnectToRoomDto } from '../../core/models/connect-to-room-dto';
import { SocketService } from '../../core/services/socket-service/socket-service';

@Component({
  selector: 'app-connect-to-game-page',
  imports: [
    FormsModule,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './connect-to-game-page.html',
  styleUrl: './connect-to-game-page.scss',
})
export class ConnectToGamePage implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly roomsService = inject(RoomsService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);

  connectToGameForm = new FormGroup<IConnectToGameForm>({
    roomNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    })
  });

  ngOnInit(): void {
    this.socketService.on<{ gameId: "123" }>('startGame').subscribe((data) => {
      console.log(data);
      this.router.navigate(['/game', data.gameId]);
    });
  }

  onSubmit() {
    if (this.connectToGameForm.valid) {
      const formValue = this.connectToGameForm.value;
      const connectToRoomDto: ConnectToRoomDto = {
        number: formValue.roomNumber!
      };

      this.roomsService.connectToRoom(connectToRoomDto).subscribe({
        next: (roomId) => {
          // redirect to game
        },
        error: (err: HttpErrorResponse) => {
          this.showMessage(err.error.detail || 'An error occurred while connecting to room');
        }
      });
    }
    else {
      this.connectToGameForm.markAllAsTouched();
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
