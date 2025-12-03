import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { PlayerState } from '../../core/models/player-state';
import { Router } from '@angular/router';

export interface EndGameDialogData {
  playerName: string;
  opponentName: string;
  myScore: number;
  opponentScore: number;
  myState: PlayerState;
  opponentState: PlayerState;
  bid: number;
  reward: number;
  transactionId: string | null;
  myId: number;
  gameId: number;
}

@Component({
  selector: 'app-end-game-dialog',
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    MatDialogTitle
  ],
  templateUrl: './end-game-dialog.html',
  styleUrl: './end-game-dialog.scss',
})
export class EndGameDialog {
  readonly dialogRef = inject(MatDialogRef<EndGameDialog>);
  private readonly router = inject(Router)

  readonly data = inject<EndGameDialogData>(MAT_DIALOG_DATA);

  constructor() {
    this.dialogRef.disableClose = true;

    this.dialogRef.backdropClick().subscribe(() => {
      this.goToMainMenu();
    });

    this.dialogRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.goToMainMenu();
      }
    });
  }

  getTitle(): string {
    if (this.data.myState === PlayerState.Won) {
      return '🎉 Поздравляем! Вы победили!';
    } else if (this.data.opponentState === PlayerState.Won) {
      return '😔 К сожалению, вы проиграли.';
    } else {
      return 'Раунд завершён';
    }
  }

  goToMainMenu(): void {
    this.dialogRef.close();
    this.router.navigate(['/']);
  }
}
