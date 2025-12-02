import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../../core/services/game-service/game-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GameState } from '../../core/models/game-state';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Card } from '../../core/models/card';
import { MatButton } from '@angular/material/button';
import { CardHelperService } from '../../core/services/card-helper-service/card-helper-service';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../core/services/socket-service/socket-service';
import { filter, interval, take } from 'rxjs';
import { AuthService } from '../../core/services/auth-service/auth-service';
import { PlayerState } from '../../core/models/player-state';
import { CardType } from '../../core/models/card-type';

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
  private readonly cardHelperService = inject(CardHelperService);
  private readonly socketService = inject(SocketService);
  private readonly authService = inject(AuthService);

  gameId = signal<number>(0);
  gameState = signal<GameState>(null!);
  selectedCard = signal<Card | null>(null);
  remainingTime = signal<number>(60);

  isBoardSwapped = computed(() => {
    const myId = this.authService.currentUserId();
    const state = this.gameState();
    return state?.player2Id === myId;
  });

  isMyTurn = computed(() => {
    const state = this.gameState();
    const myId = this.authService.currentUserId();

    if (!state || !myId) {
      return false;
    }

    if (state.player1Id === myId) {
      return state.Player1State === PlayerState.ActiveTurn || state.Player1State === PlayerState.PlayedCard;
    }

    if (state.player2Id === myId) {
      return state.Player2State === PlayerState.ActiveTurn || state.Player2State === PlayerState.PlayedCard;
    }

    return false;
  });

  canPlaySelectedCard = computed(() => {
    const card = this.selectedCard();
    const state = this.gameState();
    if (!card || !state) {
      return false;
    }

    if (!this.isMyTurn()) {
      return false;
    }

    const myHand = this.isBoardSwapped() ? state.hand2 : state.hand1;
    return myHand.some(c =>
      c && c.value === card.value && c.type === card.type
    );
  });

  constructor() {
    this.gameId.set(Number(this.route.snapshot.paramMap.get('gameId')));
  }

  ngOnInit() {
    const gameId = this.route.snapshot.paramMap.get('gameId')!;
    const jwt = localStorage.getItem('jwt') || '';

    this.socketService.connectToGame(gameId, jwt);

    this.socketService.on('current_state')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        const state: GameState = JSON.parse(data.game_state);
        this.gameState.set(state);
        this.updateTimer();
        console.log('[GamePage] State updated:', state);
      });

    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateTimer());

    this.socketService.on('reconnected')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        console.log('[GamePage] Reconnected — no need to send ready');
      });

    this.socketService.on('game_started')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        console.log('[GamePage] Game started — sending ready');
        this.socketService.sendReadyToStart();
      });

    this.socketService.status$
      .pipe(
        filter(status => status === 'connected'),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        console.log('[GamePage] Connected');
        setTimeout(() => {
          if (!this.gameState()) {
            console.log('[GamePage] First connection — sending ready');
            this.socketService.sendReadyToStart();
          } else {
            console.log('[GamePage] Already have state — skipping ready');
          }
        }, 500);
      });
  }

  private updateTimer() {
    const state = this.gameState();
    if (!state?.turnEndTime) {
      this.remainingTime.set(0);
      return;
    }

    const now = Date.now() / 1000;
    const remaining = Math.max(0, state.turnEndTime - now);

    this.remainingTime.set(Math.ceil(remaining));

    if (remaining <= 0 && this.isMyTurn()) {
      console.warn('[Game] Time is up! Auto-ending turn');
      this.onEndTurnClick();
    }
  }

  formatTime(seconds: number): string {
    if (seconds <= 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getCardImagePath(card: Card): string {
    return this.cardHelperService.getCardImagePath(card);
  }

  showCardDescription(card: Card | null): string {
    if (!card) {
      return 'Выберите карту, чтобы увидеть описание';
    }

    const sign = card.value >= 0 ? '+' : '';

    switch (card.type) {
      case CardType.AnyValue:
      case CardType.Plus:
      case CardType.Minus:
        return `${sign}${card.value} — обычная карта с фиксированным значением`;

      case CardType.FromCommonDeck:
        return `${sign}${card.value} — карта из колоды с фиксированным значением`;

      case CardType.PlusMinus:
      case CardType.PlusMinus1:
      case CardType.PlusMinus2:
      case CardType.PlusMinus3:
      case CardType.PlusMinus4:
      case CardType.PlusMinus5:
      case CardType.PlusMinus6:
      case CardType.OneOrTwoPlusMinus:
      case CardType.ThreeOrFourPlusMinus:
      case CardType.FiveOrSixPlusMinus:
        return `±${Math.abs(card.value)} — может быть +${Math.abs(card.value)} или -${Math.abs(card.value)}`;

      default:
        return `${card.type} (${sign}${card.value})`;
    }
  }

  onSelectCardClick(card: Card): void {
    if (!card) {
      this.selectedCard.set(null);
      return;
    }

    const state = this.gameState();
    if (!state) {
      return;
    }

    const myHand = this.isBoardSwapped() ? state.hand2 : state.hand1;
    const myBoard = this.isBoardSwapped() ? state.board2 : state.board1;
    const opponentBoard = this.isBoardSwapped() ? state.board1 : state.board2;

    const inMyHand = myHand.some(c => c && c.value === card.value && c.type === card.type);
    const inMyBoard = myBoard.some(c => c && c.value === card.value && c.type === card.type);
    const inOpponentBoard = opponentBoard.some(c => c && c.value === card.value && c.type === card.type);

    if (inMyHand && this.isMyTurn()) {
      this.selectedCard.set(card);
      console.log('[Game] Card selected from hand (ready to play)');
      return;
    }

    if (inMyBoard || inOpponentBoard || inMyHand) {
      this.selectedCard.set(card);
      console.log('[Game] Card info displayed (on board or hand)');
      return;
    }

    this.selectedCard.set(null);
  }

  onHandCardSwapClick(card: Card) {
    const state = this.gameState();
    const myHand = this.isBoardSwapped() ? state.hand2 : state.hand1;
    const index = myHand.findIndex(c =>
      c && c.value === card.value && c.type === card.type
    );
    if (index === null || index === undefined) {
      console.warn('[Game] Card not found in hand');
      return;
    }

    console.log(`[Game] Swapping card at index ${index}`);

    this.socketService.emit('change_card_state', {index});
  }

  private getSelectedCardIndex(): number | null {
    const state = this.gameState();
    const card = this.selectedCard();
    if (!state || !card) return null;

    const myHand = this.isBoardSwapped() ? state.hand2 : state.hand1;

    const index = myHand.findIndex(c =>
      c && c.value === card.value && c.type === card.type
    );

    return index >= 0 ? index : null;
  }

  onPlayCardClick() {
    if (!this.isMyTurn()) {
      console.warn('[Game] Not your turn!');
      return;
    }

    const index = this.getSelectedCardIndex();
    if (index === null || index === undefined) {
      console.warn('[Game] Card not found in hand');
      return;
    }

    console.log(`[Game] Playing card at index ${index}`);

    this.socketService.emit('play_card', {index});

    this.selectedCard.set(null);
  }

  onEndTurnClick() {
    if (!this.isMyTurn()) {
      console.warn('[Game] Cannot end turn — not your turn');
      return;
    }

    const state = this.gameState();
    const myId = this.authService.currentUserId();

    if (!state || !myId) {
      return;
    }

    const isPlayer1 = state.player1Id === myId;
    const myState = isPlayer1 ? state.Player1State : state.Player2State;

    if (![PlayerState.ActiveTurn, PlayerState.PlayedCard].includes(myState)) {
      console.warn('[Game] Cannot end turn — invalid player state:', myState);
      return;
    }

    console.log('[Game] Ending turn');

    this.socketService.emit('end_turn');
  }

  onStandClick() {
    console.log('onStandClick');
    this.socketService.emit('stand');
  }

  onConcedeTheGameClick() {
    console.log('onConcedeTheGameClick');
  }

  protected readonly CardType = CardType;
  protected readonly PlayerState = PlayerState;
}
