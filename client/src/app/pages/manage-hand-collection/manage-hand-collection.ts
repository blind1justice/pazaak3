import { Component, computed, inject, signal } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { CardsService } from '../../core/services/cards-service/cards-service';
import { CardHelperService } from '../../core/services/card-helper-service/card-helper-service';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

interface CardInstance {
  id: number;
  type: string;
  value: number;
}

@Component({
  selector: 'app-manage-hand-collection',
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatButton,
    MatProgressSpinner
  ],
  templateUrl: './manage-hand-collection.html',
  styleUrl: './manage-hand-collection.scss',
})
export class ManageHandCollection {
  private readonly cardsService = inject(CardsService);
  private readonly cardHelper = inject(CardHelperService);

  availableCards = signal<CardInstance[]>([]);
  chosenDeck = signal<CardInstance[]>([]);
  selectedCardId = signal<number | null>(null);
  isLoading = signal(true);

  canConfirm = computed(() => this.chosenDeck().length === 12);

  constructor() {
    this.loadAllData();
  }

  private loadAllData() {
    this.isLoading.set(true);

    Promise.all([
      this.cardsService.getAvailableCards().toPromise(),
      this.cardsService.getCurrentDeckCards().toPromise().catch(() => ({cards: []}))
    ]).then(([availableResp, deckResp]) => {
      const allCards = (availableResp?.cards || []).map((type: string, i: number) => ({
        id: i + 1,
        type,
        value: this.extractValue(type),
      }));

      this.availableCards.set(allCards);

      const currentDeck = (deckResp?.cards || []).map((type: string) => {
        return allCards.find(c => c.type === type) || {
          id: -1000 - (deckResp!.cards.indexOf(type as never) + 1),
          type,
          value: this.extractValue(type),
        };
      });

      this.chosenDeck.set(currentDeck);
      this.isLoading.set(false);
    }).catch(err => {
      console.error('Ошибка загрузки колоды:', err);
      this.isLoading.set(false);
    });
  }

  private extractValue(type: string): number {
    if (type === "ThreeOrFourPlusMinus") {
      return 3;
    }
    const match = type.match(/(Plus|Minus|PlusMinus)(\d+)/);
    if (!match) return 0;
    const sign = match[1] === 'Minus' ? -1 : 1;
    return sign * Number(match[2]);
  }

  getCardImagePath(card: CardInstance): string {
    if (card.type === "ThreeOrFourPlusMinus") {
      return 'assets/cards/gold-card.png'
    }
    const match = card.type.toLowerCase();

    if (match.startsWith('plus') && !match.includes('minus')) {
      return 'assets/cards/plus-card.png';
    }
    if (match.startsWith('minus') && !match.includes('plus')) {
      return 'assets/cards/minus-card.png';
    }
    if (match.includes('plusminus')) {
      return match.includes('minus') || card.value < 0
        ? 'assets/cards/minus-plus-card.png'
        : 'assets/cards/plus-minus-card.png';
    }

    return 'assets/cards/gold-card.png';
  }

  onCardClick(card: CardInstance) {
    if (this.isInChosenDeck(card)) {
      this.chosenDeck.update(deck => deck.filter(c => c.id !== card.id));
    } else if (this.chosenDeck().length < 12) {
      this.chosenDeck.update(deck => [...deck, card]);
    }
    this.selectedCardId.set(card.id);
  }

  isInChosenDeck(card: CardInstance): boolean {
    return this.chosenDeck().some(c => c.id === card.id);
  }

  isSelected(card: CardInstance): boolean {
    return this.selectedCardId() === card.id;
  }

  onConfirmClick() {
    if (!this.canConfirm()) return;

    const deckTypes = this.chosenDeck().map(c => c.type);
    this.cardsService.updateDeck(deckTypes).subscribe({
      next: () => alert('Колода из 12 карт успешно сохранена!'),
      error: () => alert('Ошибка сохранения колоды'),
    });
  }

  availableSlots(): number[] {
    return Array(32).fill(0);
  }

  deckSlots(): number[] {
    return Array(12).fill(0);
  }
}
