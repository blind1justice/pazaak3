import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
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
export class ConnectToGamePage implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly roomsService = inject(RoomsService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);

  games = signal<Game[]>([]);
  isLoading = signal(true);
  isJoining = signal(false);

  displayedColumns = ['id', 'creator', 'bid', 'action'];

  constructor() {
    this.loadGamesPeriodically();
  }

  private loadGamesPeriodically() {
    interval(10_000)
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
