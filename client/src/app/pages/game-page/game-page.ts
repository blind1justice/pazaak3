import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../../core/services/game-service/game-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GameState } from '../../core/models/game/game-state';
import { TokenService } from '../../core/services/token-service/token-service';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Card } from '../../core/models/game/card';
import { MatButton } from '@angular/material/button';
import { CardHelperService } from '../../core/services/card-helper-service/card-helper-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-page',
  imports: [
    CommonModule,
    MatCard,
    MatCardContent,
    MatButton
  ],
  templateUrl: './game-page.html',
  styleUrl: './game-page.scss',
})
export class GamePage implements OnInit {
  private destroyRef = inject(DestroyRef);

  private readonly route = inject(ActivatedRoute);
  private readonly gameService = inject(GameService);
  private readonly tokenService = inject(TokenService);
  private readonly cardHelperService = inject(CardHelperService);

  currentUserId = signal<number>(0);
  gameId = signal<number>(0);
  gameState = signal<GameState>(null!);
  isBoardSwapped = signal<boolean>(false);

  isMyTurn = signal<boolean>(false);
  selectedCard = signal<Card | null>(null);


  constructor() {
    this.gameId.set(Number(this.route.snapshot.paramMap.get('gameId')));
    this.currentUserId.set(this.tokenService.getCurrentUserId());
  }

  ngOnInit(): void {
    this.gameService.getGameStateById(this.gameId())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(gameState => {
        this.gameState.set(gameState);
        this.isBoardSwapped.set(gameState.player1Id !== this.currentUserId());
        this.isMyTurn.set(gameState.player1Id === this.currentUserId());
      })
  }

  getCardImagePath(card: Card): string {
    return this.cardHelperService.getCardImagePath(card);
  }

  showCardDescription(card: Card | null) {
    if (!card) {
      return '';
    }
    return card.type.toString();
  }

  onSelectCardClick(card: Card): void {
    this.selectedCard.set(card);
  }

  onHandCardSwapClick(card: Card) {
    this.selectedCard.set(card);
    console.log(card);
  }

  onStandClick() {
    console.log('onStandClick');
  }

  onEndTurnClick() {
    console.log('onEndTurnClick');
  }

  onConcedeTheGameClick() {
    console.log('onConcedeTheGameClick');
  }
}
