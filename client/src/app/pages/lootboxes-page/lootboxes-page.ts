import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { OpenLootboxBlockchainService } from '../../core/services/blockchain-services/open-lootbox-blockchain-service';

@Component({
  selector: 'app-lootboxes-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatSnackBarModule,
    RouterLink
  ],
  templateUrl: './lootboxes-page.html',
  styleUrl: './lootboxes-page.scss',
})
export class LootboxesPage {
  private readonly lootboxService = inject(OpenLootboxBlockchainService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isOpening = signal(false);

  async openCase() {
    await this.openLootbox();
  }

  async openCard() {
    await this.openLootbox();
  }

  private async openLootbox() {
    if (this.isOpening()) {
      return;
    }

    this.isOpening.set(true);
    try {
      await this.lootboxService.openLootboxAndMintCard();
      this.showMessage('Лутбокс успешно открыт!');
    } catch (err: any) {
      this.showMessage(err.message || 'Не удалось открыть лутбокс');
    } finally {
      this.isOpening.set(false);
    }
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
