import { Component, effect, inject, signal } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { AuthService } from '../../core/services/auth-service/auth-service';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import { SolanaApiService, TokenAccount } from '../../core/services/solana-api-service/solana-api-service';
import { DecimalPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-profile-page',
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderCellDef,
    MatCellDef,
    DecimalPipe,
    MatProgressSpinner,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  private readonly authService = inject(AuthService);
  private readonly solanaApi = inject(SolanaApiService);

  userInfo = signal<{ userId: number; walletId: string; nickname: string } | null>(null);
  tokens = signal<TokenAccount[]>([]);
  isLoading = signal(true);

  displayedColumns = ['name', 'balance', 'mint'];

  constructor() {
    this.userInfo.set(this.authService.getCurrentUserFromToken());

    effect(() => {
      const wallet = this.userInfo()?.walletId;
      if (wallet) {
        this.loadTokens(wallet);
      }
    });
  }

  private async loadTokens(walletAddress: string) {
    this.isLoading.set(true);
    this.solanaApi.getAllTokens(walletAddress)
      .subscribe({
        next: (tokenList) => {
          const sorted = tokenList.sort((a, b) => {
            if (a.isNative) return -1;
            if (b.isNative) return 1;
            return b.uiAmount - a.uiAmount;
          });

          this.tokens.set(sorted);
          this.isLoading.set(false);
        },
        error: err => {
          console.error('Ошибка загрузки токенов:', err);
          this.tokens.set([]);
        }
      })
  }
}
